import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const uploadOnCloudinary = async (localFilePath) => {
    // ✅ Configure inside the function, not at module level
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
// console.log("KEY AT RUNTIME:", process.env.CLOUDINARY_API_KEY)
    try {
        if (!localFilePath) return null
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
         fs.unlinkSync(localFilePath) 
        return response;

    } catch (error) {
        console.error("❌ CLOUDINARY ERROR:", error.message)
          if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)            // only delete if file exists
        }
        return null;
    }
}

export default uploadOnCloudinary