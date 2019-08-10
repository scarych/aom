const { Schema } = require("mongoose");
const { ObjectId } = Schema.Types;

exports.is = {
    enabled: { type: Boolean, default: true, required: true },
    created: { type: Date, default: Date.now, required: true },
    updated: { type: Date },
};

/** special action to make valid is structure */
exports.$is = function (is={}) {
    const { enabled = true } = is;
    return {is: {'enabled': Boolean(enabled), 'updated': new Date}};
}

exports.IndexId = { type: ObjectId, index: true };