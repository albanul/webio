define(['jquery', 'factory'], function ($) {
	$.add('file', {
		_: { params: { type: 'UploadedFileHandler' } }
	}, 'object', {
		cts: { 'file': 'uploadedFile' },
		stc: { 'uploadedFile': 'file' },
		listType: 'UploadFileList',
		handle: function (notification) {
			var file = this,
				objectId = file.objectId,
				objectType = file.objectType.split('_')[0],
				items = $.collections[$.stc[objectType] || objectType];

			if (items) {
				var fileContainer = items[objectId];

				if (fileContainer) {
					$.observable(fileContainer).setProperty({ edit: file.time });
					var fileRows = fileContainer.files._.rows || 0;
					switch (notification.action) {
					case 0:
						fileContainer.files.insert(0, file);
						$.observable(fileContainer.files._).setProperty({ rows: fileRows + 1 });
						break;
					case 2:
						fileContainer.files.__remove(file.id);
						$.observable(fileContainer.files._).setProperty({ rows: fileRows - 1 });
						break;
					default:
						break;
					}

					fileContainer.fileHandle && fileContainer.fileHandle(notification);
				}
			}
		},
		views: {
			keys: {
				success: {
					show: false
				},
				actions: {
					tmpl: '\
					<div class="actions">\
								<a title="Donwload" data-link="href{:src} {on handlers.fileUpload}" type="application/octet-stream" target="_blank" download><i class="fa fa-download"></i></a>\
								<a title="Delete"	class="delete"  data-link="{on handlers.fileDelete}"><i class="fa fa-times"></i></a>\
							</div>'
				}
			}
		},
		handlers: {
			fileUpload: function (event, data) {
				console.log('Upload');
			},
			fileDelete: function (event, data) {
				var id = data.linkCtx.data.id,
					parentData = $.view($(data.linkCtx.elem).parent().parent().parent().parent()).data,
					index = parentData.search(id);
				parentData.remove(index, function () { });
			}
		}
	});
});