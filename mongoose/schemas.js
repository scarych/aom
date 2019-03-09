const { Schema } = require("mongoose");
const { ObjectId } = Schema.Types;

exports.is = {
    enabled: { type: Boolean, default: true, required: true },
    created: { type: Date, default: Date.now, required: true },
    updated: { type: Date, default: Date.now, },
};

exports.IndexId = { type: ObjectId, index: true };