define(['factory', 'objectLabel'], function () {
    $.add('ilabel', {}, {
        addLabel: function (labelId) {
            $.create({ objectId: this.id, labelId: labelId, objectType: this.type }, 'objectLabel').save();
            return false;
        },
        removeLabel: function (labelId) {
            $.create({ objectId: this.id, labelId: labelId, objectType: this.type, deleted: true }, 'objectLabel').save();
            return false;
        }
    });
});