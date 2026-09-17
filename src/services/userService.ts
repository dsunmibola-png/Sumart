import User from "../models/User";

interface GetAllUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export const getUsers = async ({
  page = 1,
  limit = 20,
  search,
}: GetAllUsersOptions = {}) => {
  const safePage = Math.max(
    1,
    Math.floor(page)
  );

  const safeLimit = Math.min(
    Math.max(
      1,
      Math.floor(limit)
    ),
    100
  );

  const skip =
    (safePage - 1) *
    safeLimit;

  const filter: Record<
    string,
    unknown
  > = {
    role: "user",
  };

  // Search customers by name or email
  if (
    search &&
    search.trim()
  ) {
    const searchValue =
      search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const [
    users,
    totalUsers,
  ] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(skip)
      .limit(safeLimit),

    User.countDocuments(
      filter
    ),
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalUsers /
          safeLimit
      )
    );

  return {
    users,

    pagination: {
      page: safePage,
      limit: safeLimit,
      totalUsers,
      totalPages,

      hasNextPage:
        safePage <
        totalPages,

      hasPreviousPage:
        safePage > 1,
    },
  };
};

export const deleteUserAccount = async (
  userId: string,
  password: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    throw new Error(
      "Admin accounts cannot be deleted from this page"
    );
  }

  const passwordIsValid =
    await user.comparePassword(password);

  if (!passwordIsValid) {
    throw new Error(
      "Incorrect password"
    );
  }

  await User.findByIdAndDelete(userId);

  return {
    message:
      "Your account has been deleted successfully",
  };
};