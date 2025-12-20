enum Role {
    "ADMIN" ,
    "OWNER" ,
    "USER"
}

const authDto = {
    email: String,
    password: String,
    name: String,
    phone: String,
    role: Role
}

export default authDto;
