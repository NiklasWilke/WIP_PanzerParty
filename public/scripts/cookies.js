var Cookies = {
	get: function(key)
	{
		return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
	},
	set: function(key, val, end, path, domain, secure)
	{
		if (!key || /^(?:expires|max-age|path|domain|secure)$/i.test(key)) {
			return false;
		}
		var expires = '';
		if (end) {
			switch (end.constructor)
			{
				case Number:
					expires = end === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + end;
					break;
				case String:
					expires = '; expires=' + end;
				break;
				case Date:
					expires = '; expires=' + end.toUTCString();
				break;
			}
		}
		document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(val) + expires + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '') + (secure ? '; secure' : '');
		return true;
	},
	has: function(key)
	{
		return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(key).replace(/[-.+*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
	},
	list: function()
	{
		return document.cookie.split(";").map(function(c){return c.split("=")[0]});
	},
	remove: function(key, path, domain)
	{
		if (!key || !this.has(key)) return false;
		document.cookie = encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + ( domain ? '; domain=' + domain : '') + ( path ? '; path=' + path : '');
		return true;
	}
};