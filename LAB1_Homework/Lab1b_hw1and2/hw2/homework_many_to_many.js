require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_db';

const studentSchema = new Schema({
    name: { type: String, required: true },
    // Mảng tham chiếu đến các khóa học
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }] 
});

const courseSchema = new Schema({
    title: { type: String, required: true },
    maxStudents: { type: Number, required: true },
    availableSlots: { type: Number, required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }]
});

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

async function enrollCourse(studentId, courseId) {
    console.log(`\n--- BẮT ĐẦU ĐĂNG KÝ MÔN HỌC ---`);
    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) throw new Error("Không tìm thấy Sinh viên hoặc Khóa học.");

    // Kiểm tra xem sinh viên đã đăng ký môn này chưa
    if (course.students.includes(studentId)) {
        console.log(`-> LỖI: Sinh viên ${student.name} đã đăng ký khóa học "${course.title}" từ trước!`);
        return;
    }

    // Kiểm tra xem khóa học còn chỗ trống không
    if (course.availableSlots <= 0) {
        console.log(`-> LỖI: Khóa học "${course.title}" đã hết chỗ trống!`);
        return;
    }

    // Cập nhật dữ liệu vào mảng và giảm slot
    student.courses.push(courseId);
    course.students.push(studentId);
    course.availableSlots -= 1;

    // Lưu đồng thời cả 2 bảng
    await Promise.all([student.save(), course.save()]);
    console.log(`=> THÀNH CÔNG: Đã đăng ký môn "${course.title}" cho ${student.name}. (Slot còn lại: ${course.availableSlots})`);
}

async function dropCourse(studentId, courseId) {
    console.log(`\n--- BẮT ĐẦU HỦY MÔN HỌC ---`);
    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) throw new Error("Không tìm thấy Sinh viên hoặc Khóa học.");

    // Kiểm tra xem sinh viên có thực sự đang học môn này không
    if (!course.students.includes(studentId)) {
        console.log(`-> LỖI: Sinh viên ${student.name} chưa hề đăng ký khóa học "${course.title}"!`);
        return;
    }

    student.courses.pull(courseId);
    course.students.pull(studentId);
    course.availableSlots += 1;

    await Promise.all([student.save(), course.save()]);
    console.log(`=> THÀNH CÔNG: Đã hủy môn "${course.title}" cho ${student.name}. (Slot được hoàn lại: ${course.availableSlots})`);
}

async function runHomework() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Đã kết nối cơ sở dữ liệu MongoDB.");

        // Dọn dẹp dữ liệu cũ để test từ đầu
        await Student.deleteMany({});
        await Course.deleteMany({});

        // Tạo dữ liệu giả lập ban đầu
        const newStudent = await Student.create({ name: "Nguyen Van A" });
        const newCourse = await Course.create({ 
            title: "Lập trình Node.js Backend", 
            maxStudents: 40, 
            availableSlots: 1 // Cố tình set 1 slot để test chức năng báo lỗi hết chỗ
        });
        const studentB = await Student.create({ name: "Tran Thi B" });

        await enrollCourse(newStudent._id, newCourse._id);

        await enrollCourse(newStudent._id, newCourse._id);

        await enrollCourse(studentB._id, newCourse._id);

        await dropCourse(newStudent._id, newCourse._id);

    } catch (error) {
        console.error("Lỗi hệ thống:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("\nĐã đóng kết nối CSDL.");
    }
}

runHomework();