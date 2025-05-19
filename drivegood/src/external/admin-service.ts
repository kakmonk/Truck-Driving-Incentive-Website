import { getRequest, postRequest, table } from './api-requests';

const adminUsers = [
    { AdminID: 'admin1@admin.com', email: 'admin1@admin.com', name: 'Admin One' },
    { AdminID: 'admin2@example.com', email: 'admin2@example.com', name: 'Admin Two' },
    { AdminID: 'admin3@example.com', email: 'admin3@example.com', name: 'Admin Three' },
    { AdminID: 'admin4@example.com', email: 'admin4@example.com', name: 'Admin Four' },
    { AdminID: 'admin5@example.com', email: 'admin5@example.com', name: 'Admin Five' },
];

export const createAdmins = async () => {
    try {
        for (const user of adminUsers) {
            // Check if admin already exists
            const existingAdmin = await getRequest(table.admins, user.AdminID);
            
            if (existingAdmin && "AdminID" in existingAdmin) {
                console.log(`Admin ${user.AdminID} already exists, skipping.`);
                continue; // Skip creating this admin
            }

            // Create new admin
            const item = {
                AdminID: { S: user.AdminID },
                email: { S: user.email },
                name: { S: user.name }
            };

            const response = await postRequest(table.admins, item);
            console.log(`Admin created: ${user.AdminID}`, response);
        }

        alert("Admins created successfully!");
    } catch (error) {
        console.error('Error creating admins:', error);
    }
};
