import { asyncHandler } from "../utiles/asyncHandler.js";
import { ApiError } from "../utiles/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utiles/Cloudinary.js";
import { ApiResponse } from "../utiles/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  // console.log("email :", email);
  if (
    [fullname, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All feild ar required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email,or username is already exist ");
  }
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.avatar[0]?.path;
  // let avatarlocalpath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.avatar) &&
  //   req.files.avatar.length > 0
  // ) {
  //   avatarlocalpath = req.files.avatar[0].path;
  // }
  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  if (!avatarlocalpath) {
    throw new ApiError(400, "avatar file  is required");
  }

  const avatar = await uploadOncloudinary(avatarlocalpath);
  const coverImage = await uploadOncloudinary.apply(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createduser) {
    throw new ApiError(500, "Somthing went wrong while registering user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User Registered Successfully"));
});
export { registerUser };
