const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const validatePasswordStrength = (password) => {
  return Boolean(password && PASSWORD_POLICY_REGEX.test(password));
};

const passwordPolicyMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';

module.exports = {
  validatePasswordStrength,
  passwordPolicyMessage,
};
