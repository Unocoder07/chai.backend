import { asyncHandler } from "../utiles/asyncHandler.js";
import { ApiError } from "../utiles/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utiles/Cloudinary.js";
import { ApiResponse } from "../utiles/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { stringify } from "flatted";
import { MongoClient } from "mongodb";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(400, "something went wrong");
  }
};
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}
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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarlocalpath) {
    throw new ApiError(400, "avatar file  is required");
  }

  const avatar = await uploadOncloudinary(avatarlocalpath);
  const coverImage = await uploadOncloudinary(coverImageLocalPath);

  let encryptedPassword = await bcrypt.hash(password, 10);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password: encryptedPassword,
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
const loginUser = asyncHandler(async (req, res) => {
  // req body->data
  //username or email
  //find the user
  // password check
  //access and refresh token
  //cookies
  //response
  const { email, username, password } = req.body;
  console.log(email);
  console.log(password);

  if (!password && !email) {
    throw new ApiError(400, "username or email are required");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const ispasswordValid = await user.isPasswordCorrect(password);
  if (!ispasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedinUser = User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: JSON.parse(JSON.stringify(loggedinUser, getCircularReplacer())),
          accessToken,
          refreshToken,
        },
        "User logeed In successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { registerUser, loginUser, logoutUser };
