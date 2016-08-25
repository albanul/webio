define(['jquery', 'es5-shim', 'es5-sham'], function ($) {
	var language = (function (exports, $) {
		defaultLanguageId = 'en';
		currentLanguageId = 'en';

		dictionary = {};

		function translateTemplate(template) {
			return !template ? '' : template.replace(/((<\w+[^>]*\blang=["']en["'][^/>]*>)([^<]+)?)|(<\w+[^>]*\blang=["']en["'][^/>]*\/>)/gm, function (
				wholeMatch,
				matchedBigTag,
				matchedBigTagDeclaration,
				matchedBigTagContent,
				matchedSmallTag
			) {
				if (matchedBigTag) {
					matchedBigTagDeclaration = matchedBigTagDeclaration.replace(/\btitle *= *"([^"]+)"/, function (match, $1) {
						return 'title = "' + $1.toTranslated() + '"';
					});

					matchedBigTagDeclaration = matchedBigTagDeclaration.replace(/\bplaceholder *= *"([^"]+)"/, function (match, $1) {
						return 'placeholder = "' + $1.toTranslated() + '"';
					});

					matchedBigTagContent = matchedBigTagContent ? matchedBigTagContent.toTranslated() : '';

					return matchedBigTagDeclaration + matchedBigTagContent;
				} else if (matchedSmallTag) {
					matchedSmallTag = matchedSmallTag.replace(/\btitle *= *"([^"]+)"/, function (match, $1) {
						return 'title = "' + $1.toTranslated() + '"';
					});

					matchedSmallTag = matchedSmallTag.replace(/\bplaceholder *= *"([^"]+)"/, function (match, $1) {
						return 'placeholder = "' + $1.toTranslated() + '"';
					});

					matchedSmallTag = matchedSmallTag.replace(/\bvalue *= *"([^"]+)"/, function (match, $1) {
						return 'value = "' + $1.toTranslated() + '"';
					});

					return matchedSmallTag;
				} else {
					return template.toTranslated();
				}
			});
		}

		String.prototype.toTranslatedTemplate = function () {
			return !this ? '' : translateTemplate(this);
		};

		String.prototype.toTranslated = function (languageId) {
			var result;

			if (languageId) {
				if (languageId !== defaultLang) {
					result = dictionary[languageId][this];
				} else {
					result = this;
				}
			} else {
				if (currentLanguageId !== defaultLanguageId) {
					result = dictionary[currentLanguageId][this];
				} else {
					result = this;
				}
			}

			return result ? result + '' : this;
		}

		Number.prototype.toTranslatedNumeral = function (c0, c1, c2, c3, c4) {
			var n = this.toString().substr(-2);

			return currentLanguageId === defaultLanguageId ?
				c0 :
				(c1 + ((/^[0,2-9]?[1]$/.test(n)) ? c3 : ((/^[0,2-9]?[2-4]$/.test(n)) ? c4 : c2)));
		}

		var setDictionary = exports.setDictionary = function (name, data) {
			dictionary[name] = data;
		}

		var getCurrentLanguageId = exports.getCurrentLanguageId = function () {
			return currentLanguageId;
		}

		var setCurrentLanguageId = exports.setCurrentLanguageId = function (id) {
			currentLanguageId = id;
		}

		var templates = exports.templates = function (templates) {
			if (currentLanguageId !== defaultLanguageId) {
				Object.keys(templates).forEach(function (key) {
					templates[key] = templates[key].toTranslatedTemplate();
				});
			}

			return templates;
		}

		return exports;
	}({}, $));

	if (nodejs) {
		global.language = language;
	} else {
		window.language = language;
	}

	return language;
});