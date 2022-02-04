module.exports = function modifyReqUser(user) {
  return {
    _id: user._id,
    email: user.email,
    password: user.password,
    userName: user.userName,
    createdAt: user.createdAt,
    firstName: user.firstName,
    lastName: user.lastName,
    affiliateCode: user.affiliateCode,
    bio: user.bio,
    partneurStatus: user.partneurStatus,
    industryInterest: user.industryInterest,
    hobbies: user.hobbies,
    skills: user.skills,
    image: user.image,
    designation: user.designation,
  };
};
