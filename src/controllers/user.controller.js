import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import bcrypt from "bcrypt";

const generateAccessAndRefreshToken = async(userId) => {
try {
    const user = await User.findById(userId)
    const accessToken =  user.generateAccessToken()
   const  refreshToken =  user.generateRefreshToken()
   user.refreshToken = refreshToken
  await user.save({validateBeforeSave: false})
  return {accessToken, refreshToken}
} catch (error) {
    throw  new ApiError(500, "Something went wrong while generating refresh and access token")

}
}

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
//req.body is the data sent from the frontend, we destructure it to get the individual fields
if ([fullName, email, username, password].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required")
}

const existingUser = await User.findOne({
    $or: [{email}, {username}] //$or operator to check for either email or username
})
if(existingUser){
    throw new ApiError(409, "User already exists with this email or username")

}
// console.log(req.files)
const avatarLocalPath = req.files?.avatar?.[0]?.path //req.files is an object containing the uploaded files, avatar is the field name in the form, [0] to get the first file if multiple files are uploaded, and path to get the local path of the uploaded file
const coverImageLocalPath = req.files?.coverImage[0]?.path
//we use optional chaining to avoid errors if the files are not uploaded, if avatar is not uploaded, avatarLocalPath will be undefined
//avatarLocalPath is the local path of the uploaded avatar image, we will use this path to upload the image to cloudinary and get the url of the uploaded image to save in the database
//req.files is populated by multer middleware, it contains the files uploaded from the frontend, we can access the files using the field name specified in the form, in this case avatar and coverImage
if(!avatarLocalPath){
    throw new ApiError(400, "Avatar image is required")
}
// console.log("Avatar path:", avatarLocalPath)
// console.log("Cover path:", coverImageLocalPath)
// console.log("Files object:", req.files)
const  avatar = await uploadOnCloudinary(avatarLocalPath)
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
const  createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500, "Failed to create user")    
}

return res.status(201).json(new  ApiResponse(201, createdUser, "User registered successfully"))

})
const loginUser = asyncHandler(async (req, res) => {

//get email and password from request body
//validate the input
//check if  the user exists with the given email and password
//if user exists, login successful, return user details
//if user does not exist, throw error

const {email, username,  password} = req.body
if(!(username || email) ){
    throw new ApiError(400, "username or email is required")


}
const user = await User.findOne({
    $or: [{username}, {email}]
})
if(!user){
    throw new ApiError(404, "User not found with the given email or username")
}
const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new ApiError(401, "Invalid password")
}
const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
const options = {
    httpOnly: true,
    secure: true,
}
return res.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken
         },
        "User logged in successfully"
        
        
    )
)

})
const logoutUser = asyncHandler(async (req, res) => {
await User.findByIdAndUpdate(req.user._id, {
    $set: {
        refreshToken: undefined
    }
},{
    new: true
})
const options = {
    httpOnly: true,
    secure: true,
}
return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
if(!incomingRefreshToken){
    throw new ApiError(400, "Refresh token is required")
}
try {
const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

const user = await User.findById(decodedToken._id)
if(!user){
    throw new ApiError(401, "Invalid refresh token, user not found")
}
if(user?.refreshToken !== incomingRefreshToken){
    throw new ApiError(401, "Invalid refresh token")
}
const options = {
    httpOnly: true,
    secure: true
}
const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", newRefreshToken, options)
.json(new  ApiResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access token refreshed successfully"))
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "Current user fetched successfully"))
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "Full name and email are required")
    }
 const user =  User.findByIdAndUpdate(req.user?._id, {$set: {fullName, email}}, {new: true}).select("password") //{} used to specify the fields to update, in this case we are not updating any fields, we will handle the update logic in the pre save hook of the user model, {new: true} to return the updated user object

 return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500, "Failed to upload avatar image")
    }
   const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("password")

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(500, "Failed to upload cover image")
    }
  const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("password")
    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage}