import { asyncHandler } from "../utiles/asyncHandler.js";
import { Apierror } from "../utiles/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utiles/Cloudinary.js";
import { ApiResponse } from "../utiles/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  console.log("email :", email);
  if (
    [fullname, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new Apierror(400, "All feild ar required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new Apierror(409, "User with email,or username is already exist ");
  }
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.avatar[0]?.path;

  if (!avatarlocalpath) {
    throw new Apierror(400, "avatar is required");
  }

  const avatar = await uploadOncloudinary(avatarlocalpath);
  const coverImage = await uploadOncloudinary.apply(coverImageLocalPath);

  if (!avatar) {
    throw new Apierror(400, "avatar is required");
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
    throw new Apierror(500, "Somthing went wrong while registering user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User Registered Successfully"));
});
export { registerUser };
