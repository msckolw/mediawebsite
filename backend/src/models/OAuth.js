
const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now }, // Stores current timestamp
    user_details: { type: Object, required: true } // Stores the received user object
});

const oauthUsersSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }, // Unique email identifier
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, // Timestamp for when the document was created
    updatedAt: { type: Date, default: Date.now }, // Timestamp for the last update
    user_data: [userDataSchema] // Array of user data objects
});

const OauthUsers = mongoose.model('OauthUsers', oauthUsersSchema);

module.exports = OauthUsers;
