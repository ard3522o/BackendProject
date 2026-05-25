import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const  registerUser = asyncHandler(async (req, res) => {
//user details from frontend
//validation
//check if user already exists
//check for image and avatar
//upload to cloudinary
//create user object and save to database
//remove password from response
//check for user creation and send response
//return response
   
const {fullName, email, username, password}  = req.body;

if(fullName === ""){
    throw new ApiError(400, "Full name is required")
}
if(email === ""){
    throw new ApiError(400, "Email is required")
}
if(username === ""){
    throw new ApiError(400, "Username is required")
}
if(password === ""){
    throw new ApiError(400, "Password is required")
}

const existingUser = User.findOne({
    $or: [{email}, {username}] //$or operator to check for either email or username
})
if(existingUser){
    throw new ApiError(409, "User already exists with this email or username")
}
const avatarLocalPath = req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path
if(!avatarLocalPath){
    throw new ApiError(400, "Avatar image is required")
}

const  avatar = awaituploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(500, "Failed to upload avatar image")
}
const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),

})
const  createdUser = await User.findByIdAndUpdate(user._id).select(
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500, "Failed to create user")    
}

return res.status(201).json(new  ApiResponse(201, createdUser, "User registered successfully"))

})
export {registerUser}