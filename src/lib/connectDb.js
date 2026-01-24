import mongoose from "mongoose"
const DB_URI = process.env.DB_URI;
const db = async () => {
    try {
        if(mongoose.connection.readyState === 1) return;
        await mongoose.connect(DB_URI);
        console.log("Connected to MongoDB");
    }
    catch (error) {
        console.error("Error connecting to MongoDB", error);
    }
}
export default db;