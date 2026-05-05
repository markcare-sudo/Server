// src/modules/core/modules/module.service.js

const ApiError = require("../../../../core/errors/ApiError");
const { Permission } = require("../permissions/permission.model");
const { Role } = require("../roles/role.model");
const Module = require("./module.model");
const { generateCodeFromName } = require("../../../../utils/generateCode");
const { sequelize } = require("../../../../config/db");
const { Op, fn, col, where: sequelizeWhere } = require("sequelize");
const { log } = require("../../../../utils/auditLogger");



// CREATE
exports.createModule = async (user, payload) => {
    let { name, parent_id } = payload;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Module name is required");
    }

    name = name.trim();

    if (!parent_id || parent_id === "") {
        parent_id = null;
    } else {
        parent_id = Number(parent_id);
    }

    const code = generateCodeFromName(name);

    try {
        return await sequelize.transaction(async (t) => {

            // 🔥 FIND INCLUDING SOFT DELETED
            const existing = await Module.findOne({
                where: {
                    [Op.or]: [
                        sequelize.where(
                            sequelize.fn("LOWER", sequelize.col("name")),
                            name.toLowerCase()
                        ),
                        { code }
                    ],
                },
                paranoid: false,
                transaction: t
            });

            // 🔥 IF EXISTS
            if (existing) {

                // ✅ CASE 1: SOFT DELETED → RESTORE
                if (existing.deletedAt) {

                    await existing.restore({ transaction: t });

                    // 🔥 UPDATE DATA (optional but important)
                    await existing.update(
                        {
                            ...payload,
                            name,
                            code,
                            parent_id,
                        },
                        { transaction: t }
                    );

                    // 🔥 LOG RESTORE
                    await log({
                        userId: user.id || null,
                        action: "RESTORE",
                        module: "MODULE",
                        entityId: existing.id,
                        newValues: existing.toJSON(),
                        description: `Restored module: ${existing.name}`,
                        transaction: t,
                    });

                    return existing;
                }

                // ❌ CASE 2: ALREADY ACTIVE
                throw new ApiError(400, `Module "${name}" already exists`);
            }

            // ✅ CASE 3: CREATE NEW
            const module = await Module.create(
                {
                    ...payload,
                    name,
                    code,
                    parent_id,
                },
                { transaction: t }
            );

            // 🔥 LOG CREATE
            await log({
                userId: user.id || null,
                action: "CREATE",
                module: "MODULE",
                entityId: module.id,
                newValues: module.toJSON(),
                description: `Created module: ${module.name}`,
                transaction: t,
            });

            const actions = ["READ", "WRITE", "UPDATE", "DELETE"];

            const permissions = actions.map((action) => ({
                code: `${code}.${action}`,
                module_id: module.id,
                action,
                description: `${action} ${name}`,
            }));

            await Permission.bulkCreate(permissions, { transaction: t });

            return module;
        });

    } catch (error) {

        if (error?.original?.code === "ER_DUP_ENTRY") {
            throw new ApiError(400, `Module "${name}" already exists`);
        }

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error.message || "Failed to create module");
    }
};

// GET ALL (flat)
exports.getAllModules = async (query) => {
    let {
        search,
        page,
        limit,
        startDate,
        endDate,
        is_active,
        // navigation_type removed from here or ignored
        is_visible,
        is_clickable,
        parent_id,
        status = "ACTIVE",
    } = query;

    page = page ? parseInt(page) : null;
    limit = limit ? parseInt(limit) : null;
    const offset = page && limit ? (page - 1) * limit : null;

    const where = {};

    // 🔍 SEARCH
    if (search) {
        const searchValue = `%${search.toLowerCase()}%`;
        where[Op.or] = [
            // Standard Sequelize search logic (Cleaner than fn LOWER in many cases)
            { name: { [Op.like]: searchValue } },
            { code: { [Op.like]: searchValue } },
        ];
    }

    // ✅ STATUS FILTER
    if (is_active !== undefined) {
        if (is_active === "ACTIVE") where.is_active = true;
        else if (is_active === "INACTIVE") where.is_active = false;
    }

    // 📅 DATE FILTER
    if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    // ❌ NAVIGATION TYPE FILTER REMOVED 
    // We are ignoring navigation_type from the query to return ALL types.

    // ✅ VISIBILITY & CLICKABILITY
    if (is_visible !== undefined) {
        where.is_visible = is_visible === "true" || is_visible === true;
    }

    if (is_clickable !== undefined) {
        where.is_clickable = is_clickable === "true" || is_clickable === true;
    }

    if (parent_id !== undefined && parent_id !== null && parent_id !== "") {
        where.parent_id = parent_id;
    }

    // 🔥 ARCHIVE LOGIC
    const options = {
        where,
        include: [
            {
                model: Permission,
                as: "permissions",
                attributes: ["id", "code", "action"],
            },
        ],
        order: [["sort_order", "ASC"]],
        distinct: true, // 👈 Added this to prevent incorrect counts with 'include'
    };

    if (status === "ARCHIVED") {
        options.paranoid = false;
        where.deleted_at = { [Op.ne]: null };
    } else if (status === "ALL") {
        options.paranoid = false;
    } else {
        options.paranoid = true;
        // Sequelize handle deleted_at: null automatically when paranoid is true
    }

    // ✅ PAGINATION
    if (limit) {
        options.limit = limit;
        options.offset = offset;
    }

    const { rows, count } = await Module.findAndCountAll(options);

    return {
        data: rows.map((module) => ({
            ...module.toJSON(), // Simplifies getting all fields
            permissions: module.permissions?.map((p) => p.id) || [],
        })),
        pagination: {
            total: count,
            page: page || 1,
            limit: limit || count,
            totalPages: limit ? Math.ceil(count / limit) : 1,
        },
    };
};


exports.getModuleTree = async (roleId) => {

    // 🔥 1. Get role
    const role = await Role.findByPk(roleId);
    if (!role) throw new ApiError(404, "Role not found");

    const isSuperAdmin = role.code === "SUPER_ADMIN";

    // 🔥 2. Fetch modules
    const modules = await Module.findAll({
        where: {
            is_active: true,
            is_visible: true,
        },
        attributes: [
            "id",
            "name",
            "code",
            "path",
            "parent_id",
            "navigation_type",
            "is_clickable",
            "sort_order",
        ],
        include: [
            {
                model: Permission,
                as: "permissions",
                attributes: ["id", "code", "action", "module_id"],
                required: false,
                include: isSuperAdmin
                    ? [] // 🔥 SUPER ADMIN → no filtering
                    : [
                        {
                            model: Role,
                            as: "Roles",
                            where: { id: roleId },
                            attributes: [],
                            through: { attributes: [] },
                        },
                    ],
            },
        ],
        order: [["sort_order", "ASC"]],
    });

    // 🔥 3. FILTER (ONLY FOR NON SUPER ADMIN)
    let filteredModules = modules;

    if (!isSuperAdmin) {
        const hasAccess = (module, allModules) => {
            // ✅ direct READ permission
            const hasPermission = module.permissions?.some(
                (p) => p.action === "READ"
            );
            if (hasPermission) return true;

            // ✅ check children recursively
            return allModules.some(
                (m) =>
                    String(m.parent_id) === String(module.id) &&
                    hasAccess(m, allModules)
            );
        };

        filteredModules = modules.filter((m) =>
            hasAccess(m, modules)
        );
    }

    // 🔥 4. BUILD TREE
    const buildTree = (data, parentId = null) => {
        return data
            .filter((m) => {
                if (parentId === null) {
                    return m.parent_id === null || m.parent_id === 0;
                }
                return String(m.parent_id) === String(parentId);
            })
            .map((m) => ({
                ...m.toJSON(),
                children: buildTree(data, m.id),
            }));
    };

    return buildTree(filteredModules);
};


exports.getModuleById = async (id) => {
    const module = await Module.findByPk(id, {
        include: [
            {
                model: Permission,
                as: "permissions",
                attributes: ["id", "code", "action"],
            },
        ],
    });

    if (!module) throw new ApiError(404, "Module not found");

    return module;
};

// UPDATE
exports.updateModule = async (user, id, payload) => {
    const module = await Module.findByPk(id);
    if (!module) throw new ApiError(404, "Module not found");

    const oldValues = module.toJSON();

    let { name, parent_id } = payload;

    // 🔥 1. VALIDATION
    if (name && !name.trim()) {
        throw new ApiError(400, "Module name cannot be empty");
    }

    name = name ? name.trim() : module.name;

    // 🔥 2. FIX parent_id
    if (!parent_id || parent_id === "") {
        parent_id = null;
    } else {
        parent_id = Number(parent_id);
    }

    const oldCode = module.code;
    const oldName = module.name;

    // 🔥 3. GENERATE NEW CODE (ONLY IF NAME CHANGED)
    const newCode =
        name !== oldName ? generateCodeFromName(name) : oldCode;

    await sequelize.transaction(async (t) => {
        // 🔥 4. UPDATE MODULE
        await module.update(
            {
                ...payload,
                name,
                code: newCode,
                parent_id,
            },
            { transaction: t }
        );



        // 🔥 LOG UPDATE
        await log({
            userId: user.id || null,
            action: "UPDATE",
            module: "MODULE",
            entityId: module.id,
            oldValues,
            newValues: newCode,
            description: `Updated module: ${module.name}`,
            transaction: t,
        });

        // 🔥 5. UPDATE PERMISSIONS ONLY IF CODE/NAME CHANGED
        if (newCode !== oldCode || name !== oldName) {
            const permissions = await Permission.findAll({
                where: { module_id: id },
                transaction: t,
            });

            for (const perm of permissions) {
                const updatedCode = perm.code.replace(oldCode, newCode);
                const updatedDesc = perm.description.replace(oldName, name);

                await perm.update(
                    {
                        code: updatedCode,
                        description: updatedDesc,
                    },
                    { transaction: t }
                );
            }
        }
    });

    return module;
};


// DELETE (soft delete)
exports.deleteModule = async (user, id) => {
    const module = await Module.findByPk(id);
    if (!module) throw new ApiError(404, "Module not found");

    const oldValues = module.toJSON();

    return sequelize.transaction(async (t) => {
        // 🔥 DELETE PERMISSIONS PERMANENTLY
        await Permission.destroy({
            where: { module_id: id },
            transaction: t,
            force: true, // ✅ already correct
        });

        // 🔥 DELETE MODULE PERMANENTLY
        await module.destroy({
            transaction: t,
            force: true, // ✅ THIS IS THE KEY FIX
        });

        // 🔥 LOG DELETE
        await log({
            userId: user.id,
            action: "DELETE",
            module: "MODULE",
            entityId: module.id,
            oldValues,
            description: `Deleted module: ${module.name}`,
            transaction: t,
        });

        return true;
    });
};

exports.deleteAllModulesPermanently = async (user) => {
    const t = await sequelize.transaction();

    try {
        // 🔥 1. Disable FK checks (CRITICAL)
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction: t });

        // 🔥 2. Truncate in any order (now safe)
        await sequelize.query("TRUNCATE TABLE role_permissions", { transaction: t });
        await sequelize.query("TRUNCATE TABLE permissions", { transaction: t });
        await sequelize.query("TRUNCATE TABLE modules", { transaction: t });

        // 🔥 3. Enable FK checks back
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction: t });

        // 🔥 4. Audit log
        if (user.id) {
            await log({
                userId: user.id,
                action: "DELETE_ALL",
                module: "MODULE",
                oldValues: { message: "All modules, permissions, and mappings deleted" },
                description: "System reset: All modules permanently deleted",
                transaction: t,
            });
        }

        await t.commit();

        return {
            message: "All modules permanently deleted",
        };

    } catch (error) {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1"); // 🔥 always re-enable
        await t.rollback();
        throw error;
    }
};