export const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const isStrongPassword = (password) => passwordPolicyRegex.test(password);
export const passwordPolicyMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
