enum Role {
    "ADMIN" ,
    "OWNER" ,
    "USER"
}

export type RegisterDTO  = {
    email: String,
    password: String,
    name: String,
    phone: String,
    role: Role
}

export type LoginDTO = {
  email: string;
  password: string;
};

