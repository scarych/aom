const { Schema } = require("mongoose");
const { ObjectId } = Schema.Types;

exports.IndexId = { type: ObjectId, index: true };