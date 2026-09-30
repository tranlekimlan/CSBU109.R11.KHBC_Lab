require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

// ==========================================
// THIẾT LẬP SCHEMA VÀ TÍCH HỢP Q1 ĐẾN Q5
// ==========================================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    age: { type: Number, min: 18, max: 100 },
    role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
    isActive: { type: Boolean, default: true },
    password: { type: String, required: true }, // Thêm trường password cho Q5
    isDeleted: { type: Boolean, default: false }, // Thêm trường isDeleted cho Q4

    // Q1: Custom validation with Regex
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                return /^(03|05|07|08|09)\d{8}$/.test(v);
            },
            message: props => `${props.value} không phải là số điện thoại Việt Nam hợp lệ!`
        }
    }
}, { timestamps: true });

// Q2: Virtual properties & formatting
userSchema.virtual('displayInfo').get(function() {
    return `${this.fullName} <${this.email}> [${this.role.toUpperCase()}]`;
});
userSchema.set('toJSON', { virtuals: true });

// Q3: Static methods (Tìm user Active theo Role, xếp A-Z)
userSchema.statics.findActiveByRole = function(roleName) {
    return this.find({ role: roleName, isActive: true }).sort({ fullName: 1 });
};

// Q4: Instance methods / soft delete
userSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.isActive = false;
    return this.save();
};

// Q5: Middleware hooks - pre-save
userSchema.pre('save', function(next) {
    if (this.isModified('password')) {
        this.password = 'hashed_' + this.password; 
    }
    next();
});

// Q5: Middleware hooks - query hook
userSchema.pre(/^find/, function(next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

const User = mongoose.model('User', userSchema);

// ==========================================
// CHẠY KIỂM THỬ (TEST QUERIES)
// ==========================================
async function runTests() {
    try {
        console.log("Đang kết nối MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("-> Kết nối thành công!\n");

        // Xóa data cũ để test môi trường sạch
        await User.deleteMany({});

        // --- TEST Q1: Lỗi Validation số điện thoại ---
        console.log("--- Q1: TEST LỖI SỐ ĐIỆN THOẠI (VALIDATION) ---");
        try {
            await User.create({
                fullName: "Loi Dien Thoai", email: "loi@gmail.com", password: "123", phone: "0123456789"
            });
        } catch (err) {
            console.log("-> Bắt lỗi thành công Q1:", err.errors.phone.message);
        }

        // --- TEST Q2 & Q5 (Pre-save): Tạo dữ liệu chuẩn và xem Virtual field ---
        console.log("\n--- Q2 & Q5: TEST TẠO USER, HASH PASSWORD & VIRTUAL FIELD ---");
        const userA = await User.create({
            fullName: "Nguyen Van Hung", email: "hung@gmail.com", password: "mypassword", role: "admin", phone: "0912345678"
        });
        const userB = await User.create({
            fullName: "Tran Thi B", email: "b@gmail.com", password: "pwd", role: "user", phone: "0312345678"
        });
        const userC = await User.create({
            fullName: "Le Van C", email: "c@gmail.com", password: "pwd", role: "user", phone: "0812345678"
        });
        
        // Xuất ra dạng JSON để xem trường ảo (Virtual) displayInfo (Q2)
        console.log("-> JSON Output (Có Virtual field 'displayInfo' & Password đã bị hash):");
        console.log(JSON.stringify(userA, null, 2));


        // --- TEST Q3: Static methods (Tìm user role='user', active) ---
        console.log("\n--- Q3: TÌM USER ACTIVE BẰNG STATIC METHOD ---");
        const activeUsers = await User.findActiveByRole('user');
        console.log("-> Kết quả tìm kiếm (Sắp xếp A-Z):");
        activeUsers.forEach(u => console.log(`- ${u.fullName} (Active: ${u.isActive})`));


        // --- TEST Q4: Soft Delete ---
        console.log("\n--- Q4: THỰC HIỆN SOFT DELETE USER B ---");
        await userB.softDelete();
        console.log(`-> User ${userB.fullName} đã bị xóa mềm (isDeleted: ${userB.isDeleted}, isActive: ${userB.isActive})`);


        // --- TEST Q5 (Pre-find): Lọc tự động ---
        console.log("\n--- Q5: LẤY LẠI DANH SÁCH USERS SAU KHI SOFT DELETE ---");
        const allUsers = await User.find();
        console.log("-> Chỉ còn lại các user chưa bị xóa:");
        allUsers.forEach(u => console.log(`- ${u.fullName}`));

    } catch (error) {
        console.error("Lỗi:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("\n-> Đã đóng kết nối Mongoose.");
    }
}

runTests();