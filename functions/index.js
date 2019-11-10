/** recursive flat nested object
 * optionaly support regexp filter to get specific fields
 * source https://stackoverflow.com/a/55251598
*/
export const flattenObject = (obj, filter) => {
    const flattened = {};

    Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            Object.assign(flattened, flattenObject(obj[key], filter));
        } else {
            if (!filter || RegExp(filter).test(key)) {
                flattened[key] = obj[key];
            }
        }
    });

    return flattened;
}

exports.flattenObject = flattenObject;