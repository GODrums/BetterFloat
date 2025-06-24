!(function (t, e) {
	'object' == typeof exports && 'object' == typeof module
		? (module.exports = e())
		: 'function' == typeof define && define.amd
			? define([], e)
			: 'object' == typeof exports
				? (exports.resq = e())
				: ((t.window = t.window || {}), (t.window.resq = e()));
})(window, function () {
	return (function (t) {
		var e = {};
		function r(n) {
			if (e[n]) return e[n].exports;
			var o = (e[n] = { i: n, l: !1, exports: {} });
			return t[n].call(o.exports, o, o.exports, r), (o.l = !0), o.exports;
		}
		return (
			(r.m = t),
			(r.c = e),
			(r.d = function (t, e, n) {
				r.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: n });
			}),
			(r.r = function (t) {
				'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }), Object.defineProperty(t, '__esModule', { value: !0 });
			}),
			(r.t = function (t, e) {
				if ((1 & e && (t = r(t)), 8 & e)) return t;
				if (4 & e && 'object' == typeof t && t && t.__esModule) return t;
				var n = Object.create(null);
				if ((r.r(n), Object.defineProperty(n, 'default', { enumerable: !0, value: t }), 2 & e && 'string' != typeof t))
					for (var o in t)
						r.d(
							n,
							o,
							function (e) {
								return t[e];
							}.bind(null, o)
						);
				return n;
			}),
			(r.n = function (t) {
				var e =
					t && t.__esModule
						? function () {
								return t.default;
							}
						: function () {
								return t;
							};
				return r.d(e, 'a', e), e;
			}),
			(r.o = function (t, e) {
				return Object.prototype.hasOwnProperty.call(t, e);
			}),
			(r.p = ''),
			r((r.s = 16))
		);
	})([
		function (t, e, r) {
			'use strict';
			r.d(e, 'a', function () {
				return m;
			}),
				r.d(e, 'd', function () {
					return j;
				}),
				r.d(e, 'b', function () {
					return M;
				}),
				r.d(e, 'c', function () {
					return P;
				});
			var n = r(1),
				o = r.n(n),
				u = r(14),
				i = r.n(u),
				c = r(2),
				f = r.n(c),
				s = r(15),
				a = r.n(s);
			function l(t, e) {
				var r = Object.keys(t);
				if (Object.getOwnPropertySymbols) {
					var n = Object.getOwnPropertySymbols(t);
					e &&
						(n = n.filter(function (e) {
							return Object.getOwnPropertyDescriptor(t, e).enumerable;
						})),
						r.push.apply(r, n);
				}
				return r;
			}
			var p = Array.isArray,
				d = Object.keys;
			function x(t) {
				return 'function' == typeof t;
			}
			function y(t) {
				return t instanceof HTMLElement || t instanceof Text;
			}
			function h(t) {
				return 'object' === f()(t) && !p(t);
			}
			function b(t) {
				if (!t || 'string' == typeof t) return t;
				var e = (function (t) {
					for (var e = 1; e < arguments.length; e++) {
						var r = null != arguments[e] ? arguments[e] : {};
						e % 2
							? l(Object(r), !0).forEach(function (e) {
									i()(t, e, r[e]);
								})
							: Object.getOwnPropertyDescriptors
								? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r))
								: l(Object(r)).forEach(function (e) {
										Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(r, e));
									});
					}
					return t;
				})({}, t);
				return delete e.children, e;
			}
			function v(t, e) {
				var r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
				return (
					!(!p(t) || !p(e)) &&
					(r
						? t.length === e.length &&
							!t.find(function (t) {
								return !e.includes(t);
							})
						: t.some(function (t) {
								return e.includes(t);
							}))
				);
			}
			function _() {
				var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
					e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
					r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
					n = [];
				if (!d(t).length) return !0;
				if (null === e || !d(e).length) return !1;
				if (r) return a()(t, e);
				var o = d(t).filter(function (t) {
					return d(e).includes(t);
				});
				return (
					o.forEach(function (r) {
						h(t[r]) && h(e[r]) && (n = n.concat(_(t[r], e[r]))), (t[r] === e[r] || v(t[r], e[r])) && n.push(e);
					}),
					n.length > 0 &&
						n.filter(function (t) {
							return t;
						}).length === o.length
				);
			}
			function m(t) {
				var e,
					r = { children: [] };
				if (!t) return r;
				(r.name = x((e = t.type)) ? e.displayName || e.name : e),
					(r.props = b(t.memoizedProps)),
					(r.state = (function (t) {
						if (t) {
							var e = t.baseState;
							return e || t;
						}
					})(t.memoizedState));
				var n = t.child;
				if (n) for (r.children.push(n); n.sibling; ) r.children.push(n.sibling), (n = n.sibling);
				return (
					(r.children = r.children.map(function (t) {
						return m(t);
					})),
					x(t.type) &&
					(function (t) {
						return t.children.length > 1;
					})(r)
						? ((r.node = (function (t) {
								return t.children
									.map(function (t) {
										return t.node;
									})
									.filter(function (t) {
										return !!t;
									});
							})(r)),
							(r.isFragment = !0))
						: (r.node = (function (t) {
								return y(t.stateNode) ? t.stateNode : t.child && y(t.child.stateNode) ? t.child.stateNode : null;
							})(t)),
					r
				);
			}
			function g(t) {
				for (; t.length; ) {
					var e = t.shift();
					if (e.node) return e.node;
					e.children && Array.isArray(e.children) && t.push.apply(t, o()(e.children));
				}
			}
			function O(t, e) {
				for (var r = []; t.length; ) {
					var n = t.shift().children;
					n &&
						Array.isArray(n) &&
						n.forEach(function (n) {
							e(n) && (!n.node && Array.isArray(n.children) && (n.node = g(n.children.concat([]))), r.push(n)), t.push(n);
						});
				}
				return r;
			}
			function w(t, e) {
				var r = (function (t) {
					if (t) {
						var e = t.split('(');
						return 1 === e.length
							? t
							: e
									.find(function (t) {
										return t.includes(')');
									})
									.replace(/\)*/g, '');
					}
				})(e);
				return new RegExp(
					'^' +
						t
							.split('*')
							.map(function (t) {
								return t.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
							})
							.join('.+') +
						'$'
				).test(r);
			}
			function j(t, e) {
				var r = arguments.length > 3 ? arguments[3] : void 0;
				return t.reduce(
					function (t, e) {
						return t.concat(
							O(
								t,
								r && 'function' == typeof r
									? r
									: function (t) {
											return 'string' == typeof t.name ? w(e, t.name) : null !== t.name && 'object' === f()(t.name) && w(e, t.name.displayName);
										}
							)
						);
					},
					[e]
				);
			}
			function M(t, e, r) {
				var n = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];
				return x(r)
					? (console.warn('Functions are not supported as filter matchers'), [])
					: t.filter(function (t) {
							return (h(r) && _(r, t[e], n)) || (p(r) && v(r, t[e], n)) || t[e] === r;
						});
			}
			function P(t) {
				if (t.hasOwnProperty('_reactRootContainer')) return t._reactRootContainer._internalRoot.current;
				var e = Object.keys(t).find(function (t) {
					return t.startsWith('__reactInternalInstance') || t.startsWith('__reactFiber') || t.startsWith('__reactContainer');
				});
				return e ? t[e] : void 0;
			}
		},
		function (t, e, r) {
			var n = r(17),
				o = r(18),
				u = r(19),
				i = r(20);
			(t.exports = function (t) {
				return n(t) || o(t) || u(t) || i();
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			function r(e) {
				return (
					'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
						? ((t.exports = r =
								function (t) {
									return typeof t;
								}),
							(t.exports.default = t.exports),
							(t.exports.__esModule = !0))
						: ((t.exports = r =
								function (t) {
									return t && 'function' == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? 'symbol' : typeof t;
								}),
							(t.exports.default = t.exports),
							(t.exports.__esModule = !0)),
					r(e)
				);
			}
			(t.exports = r), (t.exports.default = t.exports), (t.exports.__esModule = !0);
		},
		function (t, e) {
			function r(e) {
				return (
					(t.exports = r =
						Object.setPrototypeOf
							? Object.getPrototypeOf
							: function (t) {
									return t.__proto__ || Object.getPrototypeOf(t);
								}),
					(t.exports.default = t.exports),
					(t.exports.__esModule = !0),
					r(e)
				);
			}
			(t.exports = r), (t.exports.default = t.exports), (t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function (t, e) {
				if (!(t instanceof e)) throw new TypeError('Cannot call a class as a function');
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			function r(t, e) {
				for (var r = 0; r < e.length; r++) {
					var n = e[r];
					(n.enumerable = n.enumerable || !1), (n.configurable = !0), 'value' in n && (n.writable = !0), Object.defineProperty(t, n.key, n);
				}
			}
			(t.exports = function (t, e, n) {
				return e && r(t.prototype, e), n && r(t, n), t;
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			function r(e, n) {
				return (
					(t.exports = r =
						Object.setPrototypeOf ||
						function (t, e) {
							return (t.__proto__ = e), t;
						}),
					(t.exports.default = t.exports),
					(t.exports.__esModule = !0),
					r(e, n)
				);
			}
			(t.exports = r), (t.exports.default = t.exports), (t.exports.__esModule = !0);
		},
		function (t, e, r) {
			var n = r(6);
			(t.exports = function (t, e) {
				if ('function' != typeof e && null !== e) throw new TypeError('Super expression must either be null or a function');
				(t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } })), e && n(t, e);
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e, r) {
			var n = r(3),
				o = r(6),
				u = r(22),
				i = r(23);
			function c(e) {
				var r = 'function' == typeof Map ? new Map() : void 0;
				return (
					(t.exports = c =
						function (t) {
							if (null === t || !u(t)) return t;
							if ('function' != typeof t) throw new TypeError('Super expression must either be null or a function');
							if (void 0 !== r) {
								if (r.has(t)) return r.get(t);
								r.set(t, e);
							}
							function e() {
								return i(t, arguments, n(this).constructor);
							}
							return (e.prototype = Object.create(t.prototype, { constructor: { value: e, enumerable: !1, writable: !0, configurable: !0 } })), o(e, t);
						}),
					(t.exports.default = t.exports),
					(t.exports.__esModule = !0),
					c(e)
				);
			}
			(t.exports = c), (t.exports.default = t.exports), (t.exports.__esModule = !0);
		},
		function (t, e) {
			var r;
			r = (function () {
				return this;
			})();
			try {
				r = r || new Function('return this')();
			} catch (t) {
				'object' == typeof window && (r = window);
			}
			t.exports = r;
		},
		function (t, e) {
			(t.exports = function (t, e) {
				(null == e || e > t.length) && (e = t.length);
				for (var r = 0, n = new Array(e); r < e; r++) n[r] = t[r];
				return n;
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e, r) {
			'use strict';
			(function (t) {
				r.d(e, 'a', function () {
					return o;
				});
				var n = r(0);
				function o() {
					var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 5e3,
						r = arguments.length > 1 ? arguments[1] : void 0;
					if (t.isReactLoaded) return Promise.resolve('React already loaded');
					var o = function () {
						var t = document.createTreeWalker(document);
						if (r) return document.querySelector(r);
						for (; t.nextNode(); ) if (t.currentNode.hasOwnProperty('_reactRootContainer')) return t.currentNode;
					};
					return new Promise(function (r, u) {
						var i = !1,
							c = null;
						!(function e() {
							var u = o();
							if (u && ((t.isReactLoaded = !0), (t.rootReactElement = Object(n.c)(u)), t.rootReactElement)) return clearTimeout(c), r();
							i || setTimeout(e, 200);
						})(),
							(c = setTimeout(function () {
								(i = !0), u('Timed out');
							}, e));
					});
				}
			}).call(this, r(9));
		},
		function (t, e, r) {
			'use strict';
			r.d(e, 'a', function () {
				return g;
			});
			var n = r(1),
				o = r.n(n),
				u = r(4),
				i = r.n(u),
				c = r(5),
				f = r.n(c),
				s = r(7),
				a = r.n(s),
				l = r(13),
				p = r.n(l),
				d = r(3),
				x = r.n(d),
				y = r(8),
				h = r.n(y),
				b = r(0);
			function v(t) {
				var e = (function () {
					if ('undefined' == typeof Reflect || !Reflect.construct) return !1;
					if (Reflect.construct.sham) return !1;
					if ('function' == typeof Proxy) return !0;
					try {
						return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})), !0;
					} catch (t) {
						return !1;
					}
				})();
				return function () {
					var r,
						n = x()(t);
					if (e) {
						var o = x()(this).constructor;
						r = Reflect.construct(n, arguments, o);
					} else r = n.apply(this, arguments);
					return p()(this, r);
				};
			}
			var _ = (function (t) {
					a()(r, t);
					var e = v(r);
					function r(t) {
						return i()(this, r), t || (t = []), e.call.apply(e, [this].concat(o()(t)));
					}
					return (
						f()(r, [
							{
								key: 'byProps',
								value: function (t) {
									var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { exact: !1 },
										n = e.exact,
										o = Object(b.b)(this, 'props', t, n);
									return new r(o);
								},
							},
							{
								key: 'byState',
								value: function (t) {
									var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { exact: !1 },
										n = e.exact,
										o = Object(b.b)(this, 'state', t, n);
									return new r(o);
								},
							},
						]),
						r
					);
				})(h()(Array)),
				m = (function (t) {
					a()(r, t);
					var e = v(r);
					function r(t, n) {
						var o;
						for (var u in (i()(this, r), ((o = e.call(this, t))._nodes = n), t)) o[u] = t[u];
						return o;
					}
					return (
						f()(r, [
							{
								key: 'byProps',
								value: function (t) {
									var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { exact: !1 },
										n = e.exact,
										o = Object(b.b)(this._nodes, 'props', t, n)[0];
									return new r(o, this._nodes);
								},
							},
							{
								key: 'byState',
								value: function (t) {
									var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { exact: !1 },
										n = e.exact,
										o = Object(b.b)(this._nodes, 'state', t, n)[0];
									return new r(o, this._nodes);
								},
							},
						]),
						r
					);
				})(h()(Object)),
				g = (function () {
					function t(e, r) {
						i()(this, t),
							(this.selectors = e
								.split(' ')
								.filter(function (t) {
									return !!t;
								})
								.map(function (t) {
									return t.trim();
								})),
							(this.rootComponent = r),
							(this.tree = Object(b.a)(this.rootComponent));
					}
					return (
						f()(t, [
							{
								key: 'find',
								value: function () {
									return (this.nodes = new _(Object(b.d)(this.selectors, this.tree, !0))), new m(this.nodes[0], this.nodes);
								},
							},
							{
								key: 'findAll',
								value: function () {
									return new _(Object(b.d)(this.selectors, this.tree));
								},
							},
						]),
						t
					);
				})();
		},
		function (t, e, r) {
			var n = r(2).default,
				o = r(21);
			(t.exports = function (t, e) {
				return !e || ('object' !== n(e) && 'function' != typeof e) ? o(t) : e;
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function (t, e, r) {
				return e in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : (t[e] = r), t;
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e, r) {
			'use strict';
			var n = Array.isArray,
				o = Object.keys,
				u = Object.prototype.hasOwnProperty;
			t.exports = function t(e, r) {
				if (e === r) return !0;
				if (e && r && 'object' == typeof e && 'object' == typeof r) {
					var i,
						c,
						f,
						s = n(e),
						a = n(r);
					if (s && a) {
						if ((c = e.length) != r.length) return !1;
						for (i = c; 0 != i--; ) if (!t(e[i], r[i])) return !1;
						return !0;
					}
					if (s != a) return !1;
					var l = e instanceof Date,
						p = r instanceof Date;
					if (l != p) return !1;
					if (l && p) return e.getTime() == r.getTime();
					var d = e instanceof RegExp,
						x = r instanceof RegExp;
					if (d != x) return !1;
					if (d && x) return e.toString() == r.toString();
					var y = o(e);
					if ((c = y.length) !== o(r).length) return !1;
					for (i = c; 0 != i--; ) if (!u.call(r, y[i])) return !1;
					for (i = c; 0 != i--; ) if (!t(e[(f = y[i])], r[f])) return !1;
					return !0;
				}
				return e != e && r != r;
			};
		},
		function (t, e, r) {
			'use strict';
			r.r(e),
				function (t) {
					r.d(e, 'resq$', function () {
						return c;
					}),
						r.d(e, 'resq$$', function () {
							return f;
						});
					var n = r(12),
						o = r(11);
					r.d(e, 'waitToLoadReact', function () {
						return o.a;
					});
					var u = r(0);
					function i(e, r, o) {
						if (!o && !t.isReactLoaded) throw new Error('Could not find the root element of your application');
						var i = t.rootReactElement;
						if ((o instanceof HTMLElement && (i = Object(u.c)(o)), !i)) throw new Error('Could not find instance of React in given element');
						return new n.a(e, i)[r]();
					}
					function c(t, e) {
						return i(t, 'find', e);
					}
					function f(t, e) {
						return i(t, 'findAll', e);
					}
				}.call(this, r(9));
		},
		function (t, e, r) {
			var n = r(10);
			(t.exports = function (t) {
				if (Array.isArray(t)) return n(t);
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function (t) {
				if (('undefined' != typeof Symbol && null != t[Symbol.iterator]) || null != t['@@iterator']) return Array.from(t);
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e, r) {
			var n = r(10);
			(t.exports = function (t, e) {
				if (t) {
					if ('string' == typeof t) return n(t, e);
					var r = Object.prototype.toString.call(t).slice(8, -1);
					return (
						'Object' === r && t.constructor && (r = t.constructor.name),
						'Map' === r || 'Set' === r ? Array.from(t) : 'Arguments' === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r) ? n(t, e) : void 0
					);
				}
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function () {
				throw new TypeError('Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.');
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function (t) {
				if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
				return t;
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function (t) {
				return -1 !== Function.toString.call(t).indexOf('[native code]');
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
		function (t, e, r) {
			var n = r(6),
				o = r(24);
			function u(e, r, i) {
				return (
					o()
						? ((t.exports = u = Reflect.construct), (t.exports.default = t.exports), (t.exports.__esModule = !0))
						: ((t.exports = u =
								function (t, e, r) {
									var o = [null];
									o.push.apply(o, e);
									var u = new (Function.bind.apply(t, o))();
									return r && n(u, r.prototype), u;
								}),
							(t.exports.default = t.exports),
							(t.exports.__esModule = !0)),
					u.apply(null, arguments)
				);
			}
			(t.exports = u), (t.exports.default = t.exports), (t.exports.__esModule = !0);
		},
		function (t, e) {
			(t.exports = function () {
				if ('undefined' == typeof Reflect || !Reflect.construct) return !1;
				if (Reflect.construct.sham) return !1;
				if ('function' == typeof Proxy) return !0;
				try {
					return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})), !0;
				} catch (t) {
					return !1;
				}
			}),
				(t.exports.default = t.exports),
				(t.exports.__esModule = !0);
		},
	]);
});
