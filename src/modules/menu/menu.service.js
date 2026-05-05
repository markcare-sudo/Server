// src/modules/menu/menu.service.js

const { Op } = require("sequelize");
const { Role } = require("../control-panel/ima/roles/role.model");
const { Permission } = require("../control-panel/ima/permissions/permission.model");
const Module = require("../control-panel/ima/modules/module.model");

// 🔥 Build Tree
const buildTree = (data, parentId = null) => {
    return data
        .filter((m) => {
            if (parentId === null) {
                return m.parent_id === null || m.parent_id === 0;
            }
            return String(m.parent_id) === String(parentId);
        })
        .map((m) => ({
            id: m.id,
            name: m.name,
            code: m.code,
            path: m.path,
            icon: m.icon,
            children: buildTree(data, m.id),
        }));
};

// 🔥 MAIN SERVICE
const getUserMenu = async (user) => {
    const { is_super_admin, selectedRole } = user;

    const activeRoleId = selectedRole?.id;

    // 🔥 1. SUPER ADMIN → ALL SIDEBAR MODULES
    if (is_super_admin) {
        const modules = await Module.findAll({
            where: {
                is_active: true,
                is_visible: true,
                navigation_type: "SIDEBAR", // 🔥 IMPORTANT
            },
            order: [["sort_order", "ASC"]],
        });

        return buildTree(modules);
    }

    if (!activeRoleId) return [];

    // 🔥 2. GET ROLE WITH PERMISSIONS
    const role = await Role.findByPk(activeRoleId, {
        include: [
            {
                model: Permission,
                as: "permissions",
                attributes: ["module_id", "action"],
            },
        ],
    });

    if (!role || !role.permissions) return [];

    // 🔥 3. FILTER ONLY READ PERMISSIONS
    const allowedModuleIds = new Set();

    role.permissions.forEach((perm) => {
        if (perm.module_id && perm.action === "READ") {
            allowedModuleIds.add(perm.module_id);
        }
    });

    if (allowedModuleIds.size === 0) return [];

    // 🔥 4. FETCH MODULES
    const modules = await Module.findAll({
        where: {
            id: { [Op.in]: Array.from(allowedModuleIds) },
            is_active: true,
            is_visible: true,
            navigation_type: "SIDEBAR",
        },
        order: [["sort_order", "ASC"]],
    });

    // 🔥 5. INCLUDE PARENTS (IMPORTANT FOR TREE)
    const allModules = await Module.findAll({
        where: {
            is_active: true,
            is_visible: true,
            navigation_type: "SIDEBAR",
        },
        order: [["sort_order", "ASC"]],
    });

    const moduleMap = new Map(allModules.map((m) => [m.id, m]));

    const finalSet = new Map();

    // include module + its parents
    modules.forEach((m) => {
        let current = m;

        while (current) {
            finalSet.set(current.id, current);
            current = current.parent_id
                ? moduleMap.get(current.parent_id)
                : null;
        }
    });

    const finalModules = Array.from(finalSet.values());

    // 🔥 6. BUILD TREE
    return buildTree(finalModules);
};


// 🔥 optional: simple grouping (1 level only)
const buildTopbar = (modules) => {
    return modules.map((m) => ({
        id: m.id,
        label: m.name,
        code: m.code,
        path: m.path,
        icon: m.icon,
    }));
};

const getTopbarMenu = async (user) => {
    const { isSuperAdmin, selectedRole, roleId } = user;

    const activeRoleId = selectedRole?.id || roleId;

    // 🔥 1. SUPER ADMIN → ALL TOPBAR MODULES
    if (isSuperAdmin) {
        const modules = await Module.findAll({
            where: {
                is_active: true,
                is_visible: true,
                navigation_type: "TOPBAR", // 🔥 KEY
            },
            order: [["sort_order", "ASC"]],
        });

        return buildTopbar(modules);
    }

    if (!activeRoleId) return [];

    // 🔥 2. GET ROLE WITH PERMISSIONS
    const role = await Role.findByPk(activeRoleId, {
        include: [
            {
                model: Permission,
                as: "permissions",
                attributes: ["module_id", "action"],
            },
        ],
    });

    if (!role || !role.permissions) return [];

    // 🔥 3. FILTER ONLY READ PERMISSIONS
    const allowedModuleIds = new Set();

    role.permissions.forEach((perm) => {
        if (perm.module_id && perm.action === "READ") {
            allowedModuleIds.add(perm.module_id);
        }
    });

    if (allowedModuleIds.size === 0) return [];

    // 🔥 4. FETCH TOPBAR MODULES ONLY
    const modules = await Module.findAll({
        where: {
            id: { [Op.in]: Array.from(allowedModuleIds) },
            is_active: true,
            is_visible: true,
            navigation_type: "TOPBAR", // 🔥 KEY
        },
        order: [["sort_order", "ASC"]],
    });

    return buildTopbar(modules);
};

module.exports = {
    getUserMenu,
    getTopbarMenu,
};