const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const AppError = require("../utils/AppError");

const Wallet = sequelize.define(
  "Wallet",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    last_updated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "wallets",
    timestamps: false,
    underscored: true,
  }
);

/**
 * Initializes or cleanly fetches the single constrained wallet dynamically per user
 */
Wallet.getOrCreate = async function(userId, transaction) {
  const [wallet] = await this.findOrCreate({
    where: { user_id: userId },
    defaults: { balance: 0.00, last_updated: new Date() },
    transaction
  });
  return wallet;
};

/**
 * Mutates balance strictly inside explicitly passed transactional contexts pushing native immutable ledger nodes simultaneously.
 */
Wallet.prototype.credit = async function(amount, referenceId, description, transaction) {
  const parsedAmt = parseFloat(amount);
  if (parsedAmt <= 0) throw new AppError("Credit amount must be greater than 0", 400);

  const newBalance = parseFloat(this.balance) + parsedAmt;
  
  await this.update({ balance: newBalance, last_updated: new Date() }, { transaction });
  
  if (sequelize.models.WalletTransaction) {
    await sequelize.models.WalletTransaction.create({
      wallet_id: this.id,
      amount: parsedAmt,
      type: "CREDIT",
      reference_id: referenceId,
      description: description,
      created_at: new Date()
    }, { transaction });
  }

  return newBalance;
};

/**
 * Debit checks boundaries natively aborting via isolated generic exception protocols securely enforcing atomic guarantees securely.
 */
Wallet.prototype.debit = async function(amount, referenceId, description, transaction) {
  const parsedAmt = parseFloat(amount);
  if (parsedAmt <= 0) throw new AppError("Debit amount must be greater than 0", 400);

  const currentBalance = parseFloat(this.balance);
  if (currentBalance < parsedAmt) {
    throw new AppError("Insufficient wallet balance.", 400); // Trigger standard HTTP 400 rejection automatically caught linearly
  }

  const newBalance = currentBalance - parsedAmt;
  
  await this.update({ balance: newBalance, last_updated: new Date() }, { transaction });

  if (sequelize.models.WalletTransaction) {
    await sequelize.models.WalletTransaction.create({
      wallet_id: this.id,
      amount: parsedAmt,
      type: "DEBIT",
      reference_id: referenceId,
      description: description,
      created_at: new Date()
    }, { transaction });
  }

  return newBalance;
};

module.exports = { Wallet };
