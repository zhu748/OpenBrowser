var e;
(function(e10) {
  e10.assertEqual = (e11) => {
  };
  function t9(e11) {
  }
  e10.assertIs = t9;
  function n2(e11) {
    throw Error();
  }
  e10.assertNever = n2, e10.arrayToEnum = (e11) => {
    let t10 = {};
    for (let n3 of e11) t10[n3] = n3;
    return t10;
  }, e10.getValidEnumValues = (t10) => {
    let n3 = e10.objectKeys(t10).filter((e11) => typeof t10[t10[e11]] != "number"), r3 = {};
    for (let e11 of n3) r3[e11] = t10[e11];
    return e10.objectValues(r3);
  }, e10.objectValues = (t10) => e10.objectKeys(t10).map(function(e11) {
    return t10[e11];
  }), e10.objectKeys = typeof Object.keys == "function" ? (e11) => Object.keys(e11) : (e11) => {
    let t10 = [];
    for (let n3 in e11) Object.prototype.hasOwnProperty.call(e11, n3) && t10.push(n3);
    return t10;
  }, e10.find = (e11, t10) => {
    for (let n3 of e11) if (t10(n3)) return n3;
  }, e10.isInteger = typeof Number.isInteger == "function" ? (e11) => Number.isInteger(e11) : (e11) => typeof e11 == "number" && Number.isFinite(e11) && Math.floor(e11) === e11;
  function r2(e11, t10 = " | ") {
    return e11.map((e12) => typeof e12 == "string" ? `'${e12}'` : e12).join(t10);
  }
  e10.joinValues = r2, e10.jsonStringifyReplacer = (e11, t10) => typeof t10 == "bigint" ? t10.toString() : t10;
})(e ||= {});
var t;
(function(e10) {
  e10.mergeShapes = (e11, t9) => ({ ...e11, ...t9 });
})(t ||= {});
var n = e.arrayToEnum(["string", "nan", "number", "integer", "float", "boolean", "date", "bigint", "symbol", "function", "undefined", "null", "array", "object", "unknown", "promise", "void", "never", "map", "set"]);
var r = (e10) => {
  switch (typeof e10) {
    case "undefined":
      return n.undefined;
    case "string":
      return n.string;
    case "number":
      return Number.isNaN(e10) ? n.nan : n.number;
    case "boolean":
      return n.boolean;
    case "function":
      return n.function;
    case "bigint":
      return n.bigint;
    case "symbol":
      return n.symbol;
    case "object":
      return Array.isArray(e10) ? n.array : e10 === null ? n.null : e10.then && typeof e10.then == "function" && e10.catch && typeof e10.catch == "function" ? n.promise : typeof Map < "u" && e10 instanceof Map ? n.map : typeof Set < "u" && e10 instanceof Set ? n.set : typeof Date < "u" && e10 instanceof Date ? n.date : n.object;
    default:
      return n.unknown;
  }
};
var i = e.arrayToEnum(["invalid_type", "invalid_literal", "custom", "invalid_union", "invalid_union_discriminator", "invalid_enum_value", "unrecognized_keys", "invalid_arguments", "invalid_return_type", "invalid_date", "invalid_string", "too_small", "too_big", "invalid_intersection_types", "not_multiple_of", "not_finite"]);
var a = (e10) => JSON.stringify(e10, null, 2).replace(/"([^"]+)":/g, "$1:");
var o = class t2 extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e10) {
    super(), this.issues = [], this.addIssue = (e11) => {
      this.issues = [...this.issues, e11];
    }, this.addIssues = (e11 = []) => {
      this.issues = [...this.issues, ...e11];
    };
    let t9 = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, t9) : this.__proto__ = t9, this.name = "ZodError", this.issues = e10;
  }
  format(e10) {
    let t9 = e10 || function(e11) {
      return e11.message;
    }, n2 = { _errors: [] }, r2 = (e11) => {
      for (let i2 of e11.issues) if (i2.code === "invalid_union") i2.unionErrors.map(r2);
      else if (i2.code === "invalid_return_type") r2(i2.returnTypeError);
      else if (i2.code === "invalid_arguments") r2(i2.argumentsError);
      else if (i2.path.length === 0) n2._errors.push(t9(i2));
      else {
        let e12 = n2, r3 = 0;
        for (; r3 < i2.path.length; ) {
          let n3 = i2.path[r3];
          r3 === i2.path.length - 1 ? (e12[n3] = e12[n3] || { _errors: [] }, e12[n3]._errors.push(t9(i2))) : e12[n3] = e12[n3] || { _errors: [] }, e12 = e12[n3], r3++;
        }
      }
    };
    return r2(this), n2;
  }
  static assert(e10) {
    if (!(e10 instanceof t2)) throw Error(`Not a ZodError: ${e10}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, e.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e10 = (e11) => e11.message) {
    let t9 = {}, n2 = [];
    for (let r2 of this.issues) if (r2.path.length > 0) {
      let n3 = r2.path[0];
      t9[n3] = t9[n3] || [], t9[n3].push(e10(r2));
    } else n2.push(e10(r2));
    return { formErrors: n2, fieldErrors: t9 };
  }
  get formErrors() {
    return this.flatten();
  }
};
o.create = (e10) => new o(e10);
var s = (t9, r2) => {
  let a2;
  switch (t9.code) {
    case i.invalid_type:
      a2 = t9.received === n.undefined ? "Required" : `Expected ${t9.expected}, received ${t9.received}`;
      break;
    case i.invalid_literal:
      a2 = `Invalid literal value, expected ${JSON.stringify(t9.expected, e.jsonStringifyReplacer)}`;
      break;
    case i.unrecognized_keys:
      a2 = `Unrecognized key(s) in object: ${e.joinValues(t9.keys, ", ")}`;
      break;
    case i.invalid_union:
      a2 = "Invalid input";
      break;
    case i.invalid_union_discriminator:
      a2 = `Invalid discriminator value. Expected ${e.joinValues(t9.options)}`;
      break;
    case i.invalid_enum_value:
      a2 = `Invalid enum value. Expected ${e.joinValues(t9.options)}, received '${t9.received}'`;
      break;
    case i.invalid_arguments:
      a2 = "Invalid function arguments";
      break;
    case i.invalid_return_type:
      a2 = "Invalid function return type";
      break;
    case i.invalid_date:
      a2 = "Invalid date";
      break;
    case i.invalid_string:
      typeof t9.validation == "object" ? "includes" in t9.validation ? (a2 = `Invalid input: must include "${t9.validation.includes}"`, typeof t9.validation.position == "number" && (a2 = `${a2} at one or more positions greater than or equal to ${t9.validation.position}`)) : "startsWith" in t9.validation ? a2 = `Invalid input: must start with "${t9.validation.startsWith}"` : "endsWith" in t9.validation ? a2 = `Invalid input: must end with "${t9.validation.endsWith}"` : e.assertNever(t9.validation) : a2 = t9.validation === "regex" ? "Invalid" : `Invalid ${t9.validation}`;
      break;
    case i.too_small:
      a2 = t9.type === "array" ? `Array must contain ${t9.exact ? "exactly" : t9.inclusive ? "at least" : "more than"} ${t9.minimum} element(s)` : t9.type === "string" ? `String must contain ${t9.exact ? "exactly" : t9.inclusive ? "at least" : "over"} ${t9.minimum} character(s)` : t9.type === "number" || t9.type === "bigint" ? `Number must be ${t9.exact ? "exactly equal to " : t9.inclusive ? "greater than or equal to " : "greater than "}${t9.minimum}` : t9.type === "date" ? `Date must be ${t9.exact ? "exactly equal to " : t9.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t9.minimum))}` : "Invalid input";
      break;
    case i.too_big:
      a2 = t9.type === "array" ? `Array must contain ${t9.exact ? "exactly" : t9.inclusive ? "at most" : "less than"} ${t9.maximum} element(s)` : t9.type === "string" ? `String must contain ${t9.exact ? "exactly" : t9.inclusive ? "at most" : "under"} ${t9.maximum} character(s)` : t9.type === "number" ? `Number must be ${t9.exact ? "exactly" : t9.inclusive ? "less than or equal to" : "less than"} ${t9.maximum}` : t9.type === "bigint" ? `BigInt must be ${t9.exact ? "exactly" : t9.inclusive ? "less than or equal to" : "less than"} ${t9.maximum}` : t9.type === "date" ? `Date must be ${t9.exact ? "exactly" : t9.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t9.maximum))}` : "Invalid input";
      break;
    case i.custom:
      a2 = "Invalid input";
      break;
    case i.invalid_intersection_types:
      a2 = "Intersection results could not be merged";
      break;
    case i.not_multiple_of:
      a2 = `Number must be a multiple of ${t9.multipleOf}`;
      break;
    case i.not_finite:
      a2 = "Number must be finite";
      break;
    default:
      a2 = r2.defaultError, e.assertNever(t9);
  }
  return { message: a2 };
};
var c = s;
function ee(e10) {
  c = e10;
}
function l() {
  return c;
}
var u = (e10) => {
  let { data: t9, path: n2, errorMaps: r2, issueData: i2 } = e10, a2 = [...n2, ...i2.path || []], o2 = { ...i2, path: a2 };
  if (i2.message !== void 0) return { ...i2, path: a2, message: i2.message };
  let s2 = "", c2 = r2.filter((e11) => !!e11).slice().reverse();
  for (let e11 of c2) s2 = e11(o2, { data: t9, defaultError: s2 }).message;
  return { ...i2, path: a2, message: s2 };
};
var te = [];
function d(e10, t9) {
  let n2 = l(), r2 = u({ issueData: t9, data: e10.data, path: e10.path, errorMaps: [e10.common.contextualErrorMap, e10.schemaErrorMap, n2, n2 === s ? void 0 : s].filter((e11) => !!e11) });
  e10.common.issues.push(r2);
}
var f = class e2 {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e10, t9) {
    let n2 = [];
    for (let r2 of t9) {
      if (r2.status === "aborted") return p;
      r2.status === "dirty" && e10.dirty(), n2.push(r2.value);
    }
    return { status: e10.value, value: n2 };
  }
  static async mergeObjectAsync(t9, n2) {
    let r2 = [];
    for (let e10 of n2) {
      let t10 = await e10.key, n3 = await e10.value;
      r2.push({ key: t10, value: n3 });
    }
    return e2.mergeObjectSync(t9, r2);
  }
  static mergeObjectSync(e10, t9) {
    let n2 = {};
    for (let r2 of t9) {
      let { key: t10, value: i2 } = r2;
      if (t10.status === "aborted" || i2.status === "aborted") return p;
      t10.status === "dirty" && e10.dirty(), i2.status === "dirty" && e10.dirty(), t10.value !== "__proto__" && (i2.value !== void 0 || r2.alwaysSet) && (n2[t10.value] = i2.value);
    }
    return { status: e10.value, value: n2 };
  }
};
var p = Object.freeze({ status: "aborted" });
var ne = (e10) => ({ status: "dirty", value: e10 });
var m = (e10) => ({ status: "valid", value: e10 });
var re = (e10) => e10.status === "aborted";
var ie = (e10) => e10.status === "dirty";
var h = (e10) => e10.status === "valid";
var g = (e10) => typeof Promise < "u" && e10 instanceof Promise;
var _;
(function(e10) {
  e10.errToObj = (e11) => typeof e11 == "string" ? { message: e11 } : e11 || {}, e10.toString = (e11) => typeof e11 == "string" ? e11 : e11?.message;
})(_ ||= {});
var v = class {
  constructor(e10, t9, n2, r2) {
    this._cachedPath = [], this.parent = e10, this.data = t9, this._path = n2, this._key = r2;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
};
var ae = (e10, t9) => {
  if (h(t9)) return { success: !0, data: t9.value };
  if (!e10.common.issues.length) throw Error("Validation failed but no issues detected.");
  return { success: !1, get error() {
    if (this._error) return this._error;
    let t10 = new o(e10.common.issues);
    return this._error = t10, this._error;
  } };
};
function y(e10) {
  if (!e10) return {};
  let { errorMap: t9, invalid_type_error: n2, required_error: r2, description: i2 } = e10;
  if (t9 && (n2 || r2)) throw Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return t9 ? { errorMap: t9, description: i2 } : { errorMap: (t10, i3) => {
    let { message: a2 } = e10;
    return t10.code === "invalid_enum_value" ? { message: a2 ?? i3.defaultError } : i3.data === void 0 ? { message: a2 ?? r2 ?? i3.defaultError } : t10.code === "invalid_type" ? { message: a2 ?? n2 ?? i3.defaultError } : { message: i3.defaultError };
  }, description: i2 };
}
var b = class {
  get description() {
    return this._def.description;
  }
  _getType(e10) {
    return r(e10.data);
  }
  _getOrReturnCtx(e10, t9) {
    return t9 || { common: e10.parent.common, data: e10.data, parsedType: r(e10.data), schemaErrorMap: this._def.errorMap, path: e10.path, parent: e10.parent };
  }
  _processInputParams(e10) {
    return { status: new f(), ctx: { common: e10.parent.common, data: e10.data, parsedType: r(e10.data), schemaErrorMap: this._def.errorMap, path: e10.path, parent: e10.parent } };
  }
  _parseSync(e10) {
    let t9 = this._parse(e10);
    if (g(t9)) throw Error("Synchronous parse encountered promise.");
    return t9;
  }
  _parseAsync(e10) {
    let t9 = this._parse(e10);
    return Promise.resolve(t9);
  }
  parse(e10, t9) {
    let n2 = this.safeParse(e10, t9);
    if (n2.success) return n2.data;
    throw n2.error;
  }
  safeParse(e10, t9) {
    let n2 = { common: { issues: [], async: t9?.async ?? !1, contextualErrorMap: t9?.errorMap }, path: t9?.path || [], schemaErrorMap: this._def.errorMap, parent: null, data: e10, parsedType: r(e10) };
    return ae(n2, this._parseSync({ data: e10, path: n2.path, parent: n2 }));
  }
  "~validate"(e10) {
    let t9 = { common: { issues: [], async: !!this["~standard"].async }, path: [], schemaErrorMap: this._def.errorMap, parent: null, data: e10, parsedType: r(e10) };
    if (!this["~standard"].async) try {
      let n2 = this._parseSync({ data: e10, path: [], parent: t9 });
      return h(n2) ? { value: n2.value } : { issues: t9.common.issues };
    } catch (e11) {
      e11?.message?.toLowerCase()?.includes("encountered") && (this["~standard"].async = !0), t9.common = { issues: [], async: !0 };
    }
    return this._parseAsync({ data: e10, path: [], parent: t9 }).then((e11) => h(e11) ? { value: e11.value } : { issues: t9.common.issues });
  }
  async parseAsync(e10, t9) {
    let n2 = await this.safeParseAsync(e10, t9);
    if (n2.success) return n2.data;
    throw n2.error;
  }
  async safeParseAsync(e10, t9) {
    let n2 = { common: { issues: [], contextualErrorMap: t9?.errorMap, async: !0 }, path: t9?.path || [], schemaErrorMap: this._def.errorMap, parent: null, data: e10, parsedType: r(e10) }, i2 = this._parse({ data: e10, path: n2.path, parent: n2 });
    return ae(n2, await (g(i2) ? i2 : Promise.resolve(i2)));
  }
  refine(e10, t9) {
    let n2 = (e11) => typeof t9 == "string" || t9 === void 0 ? { message: t9 } : typeof t9 == "function" ? t9(e11) : t9;
    return this._refinement((t10, r2) => {
      let a2 = e10(t10), o2 = () => r2.addIssue({ code: i.custom, ...n2(t10) });
      return typeof Promise < "u" && a2 instanceof Promise ? a2.then((e11) => e11 ? !0 : (o2(), !1)) : a2 ? !0 : (o2(), !1);
    });
  }
  refinement(e10, t9) {
    return this._refinement((n2, r2) => e10(n2) ? !0 : (r2.addIssue(typeof t9 == "function" ? t9(n2, r2) : t9), !1));
  }
  _refinement(e10) {
    return new q({ schema: this, typeName: $.ZodEffects, effect: { type: "refinement", refinement: e10 } });
  }
  superRefine(e10) {
    return this._refinement(e10);
  }
  constructor(e10) {
    this.spa = this.safeParseAsync, this._def = e10, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = { version: 1, vendor: "zod", validate: (e11) => this["~validate"](e11) };
  }
  optional() {
    return J.create(this, this._def);
  }
  nullable() {
    return Y.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return N.create(this);
  }
  promise() {
    return K.create(this, this._def);
  }
  or(e10) {
    return I.create([this, e10], this._def);
  }
  and(e10) {
    return R.create(this, e10, this._def);
  }
  transform(e10) {
    return new q({ ...y(this._def), schema: this, typeName: $.ZodEffects, effect: { type: "transform", transform: e10 } });
  }
  default(e10) {
    let t9 = typeof e10 == "function" ? e10 : () => e10;
    return new X({ ...y(this._def), innerType: this, defaultValue: t9, typeName: $.ZodDefault });
  }
  brand() {
    return new Re({ typeName: $.ZodBranded, type: this, ...y(this._def) });
  }
  catch(e10) {
    let t9 = typeof e10 == "function" ? e10 : () => e10;
    return new Z({ ...y(this._def), innerType: this, catchValue: t9, typeName: $.ZodCatch });
  }
  describe(e10) {
    let t9 = this.constructor;
    return new t9({ ...this._def, description: e10 });
  }
  pipe(e10) {
    return ze.create(this, e10);
  }
  readonly() {
    return Q.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var oe = /^c[^\s-]{8,}$/i;
var se = /^[0-9a-z]+$/;
var ce = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var le = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var ue = /^[a-z0-9_-]{21}$/i;
var de = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var fe = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var pe = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var me = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
var he;
var ge = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var _e = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ve = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ye = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var be = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var xe = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var Se = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))";
var Ce = RegExp(`^${Se}$`);
function we(e10) {
  let t9 = "[0-5]\\d";
  e10.precision ? t9 = `${t9}\\.\\d{${e10.precision}}` : e10.precision ?? (t9 = `${t9}(\\.\\d+)?`);
  let n2 = e10.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${t9})${n2}`;
}
function Te(e10) {
  return RegExp(`^${we(e10)}$`);
}
function Ee(e10) {
  let t9 = `${Se}T${we(e10)}`, n2 = [];
  return n2.push(e10.local ? "Z?" : "Z"), e10.offset && n2.push("([+-]\\d{2}:?\\d{2})"), t9 = `${t9}(${n2.join("|")})`, RegExp(`^${t9}$`);
}
function De(e10, t9) {
  return !((t9 !== "v4" && t9 || !ge.test(e10)) && (t9 !== "v6" && t9 || !ve.test(e10)));
}
function Oe(e10, t9) {
  if (!de.test(e10)) return !1;
  try {
    let [n2] = e10.split(".");
    if (!n2) return !1;
    let r2 = n2.replace(/-/g, "+").replace(/_/g, "/").padEnd(n2.length + (4 - n2.length % 4) % 4, "="), i2 = JSON.parse(atob(r2));
    return !(typeof i2 != "object" || !i2 || "typ" in i2 && i2?.typ !== "JWT" || !i2.alg || t9 && i2.alg !== t9);
  } catch {
    return !1;
  }
}
function ke(e10, t9) {
  return !((t9 !== "v4" && t9 || !_e.test(e10)) && (t9 !== "v6" && t9 || !ye.test(e10)));
}
var x = class t3 extends b {
  _parse(t9) {
    if (this._def.coerce && (t9.data = String(t9.data)), this._getType(t9) !== n.string) {
      let e10 = this._getOrReturnCtx(t9);
      return d(e10, { code: i.invalid_type, expected: n.string, received: e10.parsedType }), p;
    }
    let r2 = new f(), a2;
    for (let n2 of this._def.checks) if (n2.kind === "min") t9.data.length < n2.value && (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.too_small, minimum: n2.value, type: "string", inclusive: !0, exact: !1, message: n2.message }), r2.dirty());
    else if (n2.kind === "max") t9.data.length > n2.value && (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.too_big, maximum: n2.value, type: "string", inclusive: !0, exact: !1, message: n2.message }), r2.dirty());
    else if (n2.kind === "length") {
      let e10 = t9.data.length > n2.value, o2 = t9.data.length < n2.value;
      (e10 || o2) && (a2 = this._getOrReturnCtx(t9, a2), e10 ? d(a2, { code: i.too_big, maximum: n2.value, type: "string", inclusive: !0, exact: !0, message: n2.message }) : o2 && d(a2, { code: i.too_small, minimum: n2.value, type: "string", inclusive: !0, exact: !0, message: n2.message }), r2.dirty());
    } else if (n2.kind === "email") pe.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "email", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "emoji") he ||= new RegExp(me, "u"), he.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "emoji", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "uuid") le.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "uuid", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "nanoid") ue.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "nanoid", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "cuid") oe.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "cuid", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "cuid2") se.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "cuid2", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "ulid") ce.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "ulid", code: i.invalid_string, message: n2.message }), r2.dirty());
    else if (n2.kind === "url") try {
      new URL(t9.data);
    } catch {
      a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "url", code: i.invalid_string, message: n2.message }), r2.dirty();
    }
    else n2.kind === "regex" ? (n2.regex.lastIndex = 0, n2.regex.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "regex", code: i.invalid_string, message: n2.message }), r2.dirty())) : n2.kind === "trim" ? t9.data = t9.data.trim() : n2.kind === "includes" ? t9.data.includes(n2.value, n2.position) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.invalid_string, validation: { includes: n2.value, position: n2.position }, message: n2.message }), r2.dirty()) : n2.kind === "toLowerCase" ? t9.data = t9.data.toLowerCase() : n2.kind === "toUpperCase" ? t9.data = t9.data.toUpperCase() : n2.kind === "startsWith" ? t9.data.startsWith(n2.value) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.invalid_string, validation: { startsWith: n2.value }, message: n2.message }), r2.dirty()) : n2.kind === "endsWith" ? t9.data.endsWith(n2.value) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.invalid_string, validation: { endsWith: n2.value }, message: n2.message }), r2.dirty()) : n2.kind === "datetime" ? Ee(n2).test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.invalid_string, validation: "datetime", message: n2.message }), r2.dirty()) : n2.kind === "date" ? Ce.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.invalid_string, validation: "date", message: n2.message }), r2.dirty()) : n2.kind === "time" ? Te(n2).test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.invalid_string, validation: "time", message: n2.message }), r2.dirty()) : n2.kind === "duration" ? fe.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "duration", code: i.invalid_string, message: n2.message }), r2.dirty()) : n2.kind === "ip" ? De(t9.data, n2.version) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "ip", code: i.invalid_string, message: n2.message }), r2.dirty()) : n2.kind === "jwt" ? Oe(t9.data, n2.alg) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "jwt", code: i.invalid_string, message: n2.message }), r2.dirty()) : n2.kind === "cidr" ? ke(t9.data, n2.version) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "cidr", code: i.invalid_string, message: n2.message }), r2.dirty()) : n2.kind === "base64" ? be.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "base64", code: i.invalid_string, message: n2.message }), r2.dirty()) : n2.kind === "base64url" ? xe.test(t9.data) || (a2 = this._getOrReturnCtx(t9, a2), d(a2, { validation: "base64url", code: i.invalid_string, message: n2.message }), r2.dirty()) : e.assertNever(n2);
    return { status: r2.value, value: t9.data };
  }
  _regex(e10, t9, n2) {
    return this.refinement((t10) => e10.test(t10), { validation: t9, code: i.invalid_string, ..._.errToObj(n2) });
  }
  _addCheck(e10) {
    return new t3({ ...this._def, checks: [...this._def.checks, e10] });
  }
  email(e10) {
    return this._addCheck({ kind: "email", ..._.errToObj(e10) });
  }
  url(e10) {
    return this._addCheck({ kind: "url", ..._.errToObj(e10) });
  }
  emoji(e10) {
    return this._addCheck({ kind: "emoji", ..._.errToObj(e10) });
  }
  uuid(e10) {
    return this._addCheck({ kind: "uuid", ..._.errToObj(e10) });
  }
  nanoid(e10) {
    return this._addCheck({ kind: "nanoid", ..._.errToObj(e10) });
  }
  cuid(e10) {
    return this._addCheck({ kind: "cuid", ..._.errToObj(e10) });
  }
  cuid2(e10) {
    return this._addCheck({ kind: "cuid2", ..._.errToObj(e10) });
  }
  ulid(e10) {
    return this._addCheck({ kind: "ulid", ..._.errToObj(e10) });
  }
  base64(e10) {
    return this._addCheck({ kind: "base64", ..._.errToObj(e10) });
  }
  base64url(e10) {
    return this._addCheck({ kind: "base64url", ..._.errToObj(e10) });
  }
  jwt(e10) {
    return this._addCheck({ kind: "jwt", ..._.errToObj(e10) });
  }
  ip(e10) {
    return this._addCheck({ kind: "ip", ..._.errToObj(e10) });
  }
  cidr(e10) {
    return this._addCheck({ kind: "cidr", ..._.errToObj(e10) });
  }
  datetime(e10) {
    return typeof e10 == "string" ? this._addCheck({ kind: "datetime", precision: null, offset: !1, local: !1, message: e10 }) : this._addCheck({ kind: "datetime", precision: e10?.precision === void 0 ? null : e10?.precision, offset: e10?.offset ?? !1, local: e10?.local ?? !1, ..._.errToObj(e10?.message) });
  }
  date(e10) {
    return this._addCheck({ kind: "date", message: e10 });
  }
  time(e10) {
    return typeof e10 == "string" ? this._addCheck({ kind: "time", precision: null, message: e10 }) : this._addCheck({ kind: "time", precision: e10?.precision === void 0 ? null : e10?.precision, ..._.errToObj(e10?.message) });
  }
  duration(e10) {
    return this._addCheck({ kind: "duration", ..._.errToObj(e10) });
  }
  regex(e10, t9) {
    return this._addCheck({ kind: "regex", regex: e10, ..._.errToObj(t9) });
  }
  includes(e10, t9) {
    return this._addCheck({ kind: "includes", value: e10, position: t9?.position, ..._.errToObj(t9?.message) });
  }
  startsWith(e10, t9) {
    return this._addCheck({ kind: "startsWith", value: e10, ..._.errToObj(t9) });
  }
  endsWith(e10, t9) {
    return this._addCheck({ kind: "endsWith", value: e10, ..._.errToObj(t9) });
  }
  min(e10, t9) {
    return this._addCheck({ kind: "min", value: e10, ..._.errToObj(t9) });
  }
  max(e10, t9) {
    return this._addCheck({ kind: "max", value: e10, ..._.errToObj(t9) });
  }
  length(e10, t9) {
    return this._addCheck({ kind: "length", value: e10, ..._.errToObj(t9) });
  }
  nonempty(e10) {
    return this.min(1, _.errToObj(e10));
  }
  trim() {
    return new t3({ ...this._def, checks: [...this._def.checks, { kind: "trim" }] });
  }
  toLowerCase() {
    return new t3({ ...this._def, checks: [...this._def.checks, { kind: "toLowerCase" }] });
  }
  toUpperCase() {
    return new t3({ ...this._def, checks: [...this._def.checks, { kind: "toUpperCase" }] });
  }
  get isDatetime() {
    return !!this._def.checks.find((e10) => e10.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((e10) => e10.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((e10) => e10.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((e10) => e10.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((e10) => e10.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e10) => e10.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e10) => e10.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e10) => e10.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((e10) => e10.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((e10) => e10.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e10) => e10.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e10) => e10.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e10) => e10.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((e10) => e10.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((e10) => e10.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((e10) => e10.kind === "base64url");
  }
  get minLength() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "min" && (e10 === null || t9.value > e10) && (e10 = t9.value);
    return e10;
  }
  get maxLength() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "max" && (e10 === null || t9.value < e10) && (e10 = t9.value);
    return e10;
  }
};
x.create = (e10) => new x({ checks: [], typeName: $.ZodString, coerce: e10?.coerce ?? !1, ...y(e10) });
function Ae(e10, t9) {
  let n2 = (e10.toString().split(".")[1] || "").length, r2 = (t9.toString().split(".")[1] || "").length, i2 = n2 > r2 ? n2 : r2;
  return Number.parseInt(e10.toFixed(i2).replace(".", "")) % Number.parseInt(t9.toFixed(i2).replace(".", "")) / 10 ** i2;
}
var S = class t4 extends b {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(t9) {
    if (this._def.coerce && (t9.data = Number(t9.data)), this._getType(t9) !== n.number) {
      let e10 = this._getOrReturnCtx(t9);
      return d(e10, { code: i.invalid_type, expected: n.number, received: e10.parsedType }), p;
    }
    let r2, a2 = new f();
    for (let n2 of this._def.checks) n2.kind === "int" ? e.isInteger(t9.data) || (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.invalid_type, expected: "integer", received: "float", message: n2.message }), a2.dirty()) : n2.kind === "min" ? (n2.inclusive ? t9.data < n2.value : t9.data <= n2.value) && (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.too_small, minimum: n2.value, type: "number", inclusive: n2.inclusive, exact: !1, message: n2.message }), a2.dirty()) : n2.kind === "max" ? (n2.inclusive ? t9.data > n2.value : t9.data >= n2.value) && (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.too_big, maximum: n2.value, type: "number", inclusive: n2.inclusive, exact: !1, message: n2.message }), a2.dirty()) : n2.kind === "multipleOf" ? Ae(t9.data, n2.value) !== 0 && (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.not_multiple_of, multipleOf: n2.value, message: n2.message }), a2.dirty()) : n2.kind === "finite" ? Number.isFinite(t9.data) || (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.not_finite, message: n2.message }), a2.dirty()) : e.assertNever(n2);
    return { status: a2.value, value: t9.data };
  }
  gte(e10, t9) {
    return this.setLimit("min", e10, !0, _.toString(t9));
  }
  gt(e10, t9) {
    return this.setLimit("min", e10, !1, _.toString(t9));
  }
  lte(e10, t9) {
    return this.setLimit("max", e10, !0, _.toString(t9));
  }
  lt(e10, t9) {
    return this.setLimit("max", e10, !1, _.toString(t9));
  }
  setLimit(e10, n2, r2, i2) {
    return new t4({ ...this._def, checks: [...this._def.checks, { kind: e10, value: n2, inclusive: r2, message: _.toString(i2) }] });
  }
  _addCheck(e10) {
    return new t4({ ...this._def, checks: [...this._def.checks, e10] });
  }
  int(e10) {
    return this._addCheck({ kind: "int", message: _.toString(e10) });
  }
  positive(e10) {
    return this._addCheck({ kind: "min", value: 0, inclusive: !1, message: _.toString(e10) });
  }
  negative(e10) {
    return this._addCheck({ kind: "max", value: 0, inclusive: !1, message: _.toString(e10) });
  }
  nonpositive(e10) {
    return this._addCheck({ kind: "max", value: 0, inclusive: !0, message: _.toString(e10) });
  }
  nonnegative(e10) {
    return this._addCheck({ kind: "min", value: 0, inclusive: !0, message: _.toString(e10) });
  }
  multipleOf(e10, t9) {
    return this._addCheck({ kind: "multipleOf", value: e10, message: _.toString(t9) });
  }
  finite(e10) {
    return this._addCheck({ kind: "finite", message: _.toString(e10) });
  }
  safe(e10) {
    return this._addCheck({ kind: "min", inclusive: !0, value: -(2 ** 53 - 1), message: _.toString(e10) })._addCheck({ kind: "max", inclusive: !0, value: 2 ** 53 - 1, message: _.toString(e10) });
  }
  get minValue() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "min" && (e10 === null || t9.value > e10) && (e10 = t9.value);
    return e10;
  }
  get maxValue() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "max" && (e10 === null || t9.value < e10) && (e10 = t9.value);
    return e10;
  }
  get isInt() {
    return !!this._def.checks.find((t9) => t9.kind === "int" || t9.kind === "multipleOf" && e.isInteger(t9.value));
  }
  get isFinite() {
    let e10 = null, t9 = null;
    for (let n2 of this._def.checks) {
      if (n2.kind === "finite" || n2.kind === "int" || n2.kind === "multipleOf") return !0;
      n2.kind === "min" ? (t9 === null || n2.value > t9) && (t9 = n2.value) : n2.kind === "max" && (e10 === null || n2.value < e10) && (e10 = n2.value);
    }
    return Number.isFinite(t9) && Number.isFinite(e10);
  }
};
S.create = (e10) => new S({ checks: [], typeName: $.ZodNumber, coerce: e10?.coerce || !1, ...y(e10) });
var C = class t5 extends b {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(t9) {
    if (this._def.coerce) try {
      t9.data = BigInt(t9.data);
    } catch {
      return this._getInvalidInput(t9);
    }
    if (this._getType(t9) !== n.bigint) return this._getInvalidInput(t9);
    let r2, a2 = new f();
    for (let n2 of this._def.checks) n2.kind === "min" ? (n2.inclusive ? t9.data < n2.value : t9.data <= n2.value) && (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.too_small, type: "bigint", minimum: n2.value, inclusive: n2.inclusive, message: n2.message }), a2.dirty()) : n2.kind === "max" ? (n2.inclusive ? t9.data > n2.value : t9.data >= n2.value) && (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.too_big, type: "bigint", maximum: n2.value, inclusive: n2.inclusive, message: n2.message }), a2.dirty()) : n2.kind === "multipleOf" ? t9.data % n2.value !== BigInt(0) && (r2 = this._getOrReturnCtx(t9, r2), d(r2, { code: i.not_multiple_of, multipleOf: n2.value, message: n2.message }), a2.dirty()) : e.assertNever(n2);
    return { status: a2.value, value: t9.data };
  }
  _getInvalidInput(e10) {
    let t9 = this._getOrReturnCtx(e10);
    return d(t9, { code: i.invalid_type, expected: n.bigint, received: t9.parsedType }), p;
  }
  gte(e10, t9) {
    return this.setLimit("min", e10, !0, _.toString(t9));
  }
  gt(e10, t9) {
    return this.setLimit("min", e10, !1, _.toString(t9));
  }
  lte(e10, t9) {
    return this.setLimit("max", e10, !0, _.toString(t9));
  }
  lt(e10, t9) {
    return this.setLimit("max", e10, !1, _.toString(t9));
  }
  setLimit(e10, n2, r2, i2) {
    return new t5({ ...this._def, checks: [...this._def.checks, { kind: e10, value: n2, inclusive: r2, message: _.toString(i2) }] });
  }
  _addCheck(e10) {
    return new t5({ ...this._def, checks: [...this._def.checks, e10] });
  }
  positive(e10) {
    return this._addCheck({ kind: "min", value: BigInt(0), inclusive: !1, message: _.toString(e10) });
  }
  negative(e10) {
    return this._addCheck({ kind: "max", value: BigInt(0), inclusive: !1, message: _.toString(e10) });
  }
  nonpositive(e10) {
    return this._addCheck({ kind: "max", value: BigInt(0), inclusive: !0, message: _.toString(e10) });
  }
  nonnegative(e10) {
    return this._addCheck({ kind: "min", value: BigInt(0), inclusive: !0, message: _.toString(e10) });
  }
  multipleOf(e10, t9) {
    return this._addCheck({ kind: "multipleOf", value: e10, message: _.toString(t9) });
  }
  get minValue() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "min" && (e10 === null || t9.value > e10) && (e10 = t9.value);
    return e10;
  }
  get maxValue() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "max" && (e10 === null || t9.value < e10) && (e10 = t9.value);
    return e10;
  }
};
C.create = (e10) => new C({ checks: [], typeName: $.ZodBigInt, coerce: e10?.coerce ?? !1, ...y(e10) });
var w = class extends b {
  _parse(e10) {
    if (this._def.coerce && (e10.data = !!e10.data), this._getType(e10) !== n.boolean) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { code: i.invalid_type, expected: n.boolean, received: t9.parsedType }), p;
    }
    return m(e10.data);
  }
};
w.create = (e10) => new w({ typeName: $.ZodBoolean, coerce: e10?.coerce || !1, ...y(e10) });
var T = class t6 extends b {
  _parse(t9) {
    if (this._def.coerce && (t9.data = new Date(t9.data)), this._getType(t9) !== n.date) {
      let e10 = this._getOrReturnCtx(t9);
      return d(e10, { code: i.invalid_type, expected: n.date, received: e10.parsedType }), p;
    }
    if (Number.isNaN(t9.data.getTime())) return d(this._getOrReturnCtx(t9), { code: i.invalid_date }), p;
    let r2 = new f(), a2;
    for (let n2 of this._def.checks) n2.kind === "min" ? t9.data.getTime() < n2.value && (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.too_small, message: n2.message, inclusive: !0, exact: !1, minimum: n2.value, type: "date" }), r2.dirty()) : n2.kind === "max" ? t9.data.getTime() > n2.value && (a2 = this._getOrReturnCtx(t9, a2), d(a2, { code: i.too_big, message: n2.message, inclusive: !0, exact: !1, maximum: n2.value, type: "date" }), r2.dirty()) : e.assertNever(n2);
    return { status: r2.value, value: new Date(t9.data.getTime()) };
  }
  _addCheck(e10) {
    return new t6({ ...this._def, checks: [...this._def.checks, e10] });
  }
  min(e10, t9) {
    return this._addCheck({ kind: "min", value: e10.getTime(), message: _.toString(t9) });
  }
  max(e10, t9) {
    return this._addCheck({ kind: "max", value: e10.getTime(), message: _.toString(t9) });
  }
  get minDate() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "min" && (e10 === null || t9.value > e10) && (e10 = t9.value);
    return e10 == null ? null : new Date(e10);
  }
  get maxDate() {
    let e10 = null;
    for (let t9 of this._def.checks) t9.kind === "max" && (e10 === null || t9.value < e10) && (e10 = t9.value);
    return e10 == null ? null : new Date(e10);
  }
};
T.create = (e10) => new T({ checks: [], coerce: e10?.coerce || !1, typeName: $.ZodDate, ...y(e10) });
var E = class extends b {
  _parse(e10) {
    if (this._getType(e10) !== n.symbol) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { code: i.invalid_type, expected: n.symbol, received: t9.parsedType }), p;
    }
    return m(e10.data);
  }
};
E.create = (e10) => new E({ typeName: $.ZodSymbol, ...y(e10) });
var D = class extends b {
  _parse(e10) {
    if (this._getType(e10) !== n.undefined) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { code: i.invalid_type, expected: n.undefined, received: t9.parsedType }), p;
    }
    return m(e10.data);
  }
};
D.create = (e10) => new D({ typeName: $.ZodUndefined, ...y(e10) });
var O = class extends b {
  _parse(e10) {
    if (this._getType(e10) !== n.null) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { code: i.invalid_type, expected: n.null, received: t9.parsedType }), p;
    }
    return m(e10.data);
  }
};
O.create = (e10) => new O({ typeName: $.ZodNull, ...y(e10) });
var k = class extends b {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e10) {
    return m(e10.data);
  }
};
k.create = (e10) => new k({ typeName: $.ZodAny, ...y(e10) });
var A = class extends b {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e10) {
    return m(e10.data);
  }
};
A.create = (e10) => new A({ typeName: $.ZodUnknown, ...y(e10) });
var j = class extends b {
  _parse(e10) {
    let t9 = this._getOrReturnCtx(e10);
    return d(t9, { code: i.invalid_type, expected: n.never, received: t9.parsedType }), p;
  }
};
j.create = (e10) => new j({ typeName: $.ZodNever, ...y(e10) });
var M = class extends b {
  _parse(e10) {
    if (this._getType(e10) !== n.undefined) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { code: i.invalid_type, expected: n.void, received: t9.parsedType }), p;
    }
    return m(e10.data);
  }
};
M.create = (e10) => new M({ typeName: $.ZodVoid, ...y(e10) });
var N = class e3 extends b {
  _parse(e10) {
    let { ctx: t9, status: r2 } = this._processInputParams(e10), a2 = this._def;
    if (t9.parsedType !== n.array) return d(t9, { code: i.invalid_type, expected: n.array, received: t9.parsedType }), p;
    if (a2.exactLength !== null) {
      let e11 = t9.data.length > a2.exactLength.value, n2 = t9.data.length < a2.exactLength.value;
      (e11 || n2) && (d(t9, { code: e11 ? i.too_big : i.too_small, minimum: n2 ? a2.exactLength.value : void 0, maximum: e11 ? a2.exactLength.value : void 0, type: "array", inclusive: !0, exact: !0, message: a2.exactLength.message }), r2.dirty());
    }
    if (a2.minLength !== null && t9.data.length < a2.minLength.value && (d(t9, { code: i.too_small, minimum: a2.minLength.value, type: "array", inclusive: !0, exact: !1, message: a2.minLength.message }), r2.dirty()), a2.maxLength !== null && t9.data.length > a2.maxLength.value && (d(t9, { code: i.too_big, maximum: a2.maxLength.value, type: "array", inclusive: !0, exact: !1, message: a2.maxLength.message }), r2.dirty()), t9.common.async) return Promise.all([...t9.data].map((e11, n2) => a2.type._parseAsync(new v(t9, e11, t9.path, n2)))).then((e11) => f.mergeArray(r2, e11));
    let o2 = [...t9.data].map((e11, n2) => a2.type._parseSync(new v(t9, e11, t9.path, n2)));
    return f.mergeArray(r2, o2);
  }
  get element() {
    return this._def.type;
  }
  min(t9, n2) {
    return new e3({ ...this._def, minLength: { value: t9, message: _.toString(n2) } });
  }
  max(t9, n2) {
    return new e3({ ...this._def, maxLength: { value: t9, message: _.toString(n2) } });
  }
  length(t9, n2) {
    return new e3({ ...this._def, exactLength: { value: t9, message: _.toString(n2) } });
  }
  nonempty(e10) {
    return this.min(1, e10);
  }
};
N.create = (e10, t9) => new N({ type: e10, minLength: null, maxLength: null, exactLength: null, typeName: $.ZodArray, ...y(t9) });
function P(e10) {
  if (e10 instanceof F) {
    let t9 = {};
    for (let n2 in e10.shape) {
      let r2 = e10.shape[n2];
      t9[n2] = J.create(P(r2));
    }
    return new F({ ...e10._def, shape: () => t9 });
  }
  return e10 instanceof N ? new N({ ...e10._def, type: P(e10.element) }) : e10 instanceof J ? J.create(P(e10.unwrap())) : e10 instanceof Y ? Y.create(P(e10.unwrap())) : e10 instanceof z ? z.create(e10.items.map((e11) => P(e11))) : e10;
}
var F = class t7 extends b {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null) return this._cached;
    let t9 = this._def.shape(), n2 = e.objectKeys(t9);
    return this._cached = { shape: t9, keys: n2 }, this._cached;
  }
  _parse(e10) {
    if (this._getType(e10) !== n.object) {
      let t10 = this._getOrReturnCtx(e10);
      return d(t10, { code: i.invalid_type, expected: n.object, received: t10.parsedType }), p;
    }
    let { status: t9, ctx: r2 } = this._processInputParams(e10), { shape: a2, keys: o2 } = this._getCached(), s2 = [];
    if (!(this._def.catchall instanceof j && this._def.unknownKeys === "strip")) for (let e11 in r2.data) o2.includes(e11) || s2.push(e11);
    let c2 = [];
    for (let e11 of o2) {
      let t10 = a2[e11], n2 = r2.data[e11];
      c2.push({ key: { status: "valid", value: e11 }, value: t10._parse(new v(r2, n2, r2.path, e11)), alwaysSet: e11 in r2.data });
    }
    if (this._def.catchall instanceof j) {
      let e11 = this._def.unknownKeys;
      if (e11 === "passthrough") for (let e12 of s2) c2.push({ key: { status: "valid", value: e12 }, value: { status: "valid", value: r2.data[e12] } });
      else if (e11 === "strict") s2.length > 0 && (d(r2, { code: i.unrecognized_keys, keys: s2 }), t9.dirty());
      else if (e11 !== "strip") throw Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      let e11 = this._def.catchall;
      for (let t10 of s2) {
        let n2 = r2.data[t10];
        c2.push({ key: { status: "valid", value: t10 }, value: e11._parse(new v(r2, n2, r2.path, t10)), alwaysSet: t10 in r2.data });
      }
    }
    return r2.common.async ? Promise.resolve().then(async () => {
      let e11 = [];
      for (let t10 of c2) {
        let n2 = await t10.key, r3 = await t10.value;
        e11.push({ key: n2, value: r3, alwaysSet: t10.alwaysSet });
      }
      return e11;
    }).then((e11) => f.mergeObjectSync(t9, e11)) : f.mergeObjectSync(t9, c2);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e10) {
    return _.errToObj, new t7({ ...this._def, unknownKeys: "strict", ...e10 === void 0 ? {} : { errorMap: (t9, n2) => {
      let r2 = this._def.errorMap?.(t9, n2).message ?? n2.defaultError;
      return t9.code === "unrecognized_keys" ? { message: _.errToObj(e10).message ?? r2 } : { message: r2 };
    } } });
  }
  strip() {
    return new t7({ ...this._def, unknownKeys: "strip" });
  }
  passthrough() {
    return new t7({ ...this._def, unknownKeys: "passthrough" });
  }
  extend(e10) {
    return new t7({ ...this._def, shape: () => ({ ...this._def.shape(), ...e10 }) });
  }
  merge(e10) {
    return new t7({ unknownKeys: e10._def.unknownKeys, catchall: e10._def.catchall, shape: () => ({ ...this._def.shape(), ...e10._def.shape() }), typeName: $.ZodObject });
  }
  setKey(e10, t9) {
    return this.augment({ [e10]: t9 });
  }
  catchall(e10) {
    return new t7({ ...this._def, catchall: e10 });
  }
  pick(n2) {
    let r2 = {};
    for (let t9 of e.objectKeys(n2)) n2[t9] && this.shape[t9] && (r2[t9] = this.shape[t9]);
    return new t7({ ...this._def, shape: () => r2 });
  }
  omit(n2) {
    let r2 = {};
    for (let t9 of e.objectKeys(this.shape)) n2[t9] || (r2[t9] = this.shape[t9]);
    return new t7({ ...this._def, shape: () => r2 });
  }
  deepPartial() {
    return P(this);
  }
  partial(n2) {
    let r2 = {};
    for (let t9 of e.objectKeys(this.shape)) {
      let e10 = this.shape[t9];
      r2[t9] = n2 && !n2[t9] ? e10 : e10.optional();
    }
    return new t7({ ...this._def, shape: () => r2 });
  }
  required(n2) {
    let r2 = {};
    for (let t9 of e.objectKeys(this.shape)) if (n2 && !n2[t9]) r2[t9] = this.shape[t9];
    else {
      let e10 = this.shape[t9];
      for (; e10 instanceof J; ) e10 = e10._def.innerType;
      r2[t9] = e10;
    }
    return new t7({ ...this._def, shape: () => r2 });
  }
  keyof() {
    return Fe(e.objectKeys(this.shape));
  }
};
(F.create = (e10, t9) => new F({ shape: () => e10, unknownKeys: "strip", catchall: j.create(), typeName: $.ZodObject, ...y(t9) }));
(F.strictCreate = (e10, t9) => new F({ shape: () => e10, unknownKeys: "strict", catchall: j.create(), typeName: $.ZodObject, ...y(t9) }));
(F.lazycreate = (e10, t9) => new F({ shape: e10, unknownKeys: "strip", catchall: j.create(), typeName: $.ZodObject, ...y(t9) }));
var I = class extends b {
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10), n2 = this._def.options;
    function r2(e11) {
      for (let t10 of e11) if (t10.result.status === "valid") return t10.result;
      for (let n4 of e11) if (n4.result.status === "dirty") return t9.common.issues.push(...n4.ctx.common.issues), n4.result;
      let n3 = e11.map((e12) => new o(e12.ctx.common.issues));
      return d(t9, { code: i.invalid_union, unionErrors: n3 }), p;
    }
    if (t9.common.async) return Promise.all(n2.map(async (e11) => {
      let n3 = { ...t9, common: { ...t9.common, issues: [] }, parent: null };
      return { result: await e11._parseAsync({ data: t9.data, path: t9.path, parent: n3 }), ctx: n3 };
    })).then(r2);
    {
      let e11, r3 = [];
      for (let i2 of n2) {
        let n3 = { ...t9, common: { ...t9.common, issues: [] }, parent: null }, a3 = i2._parseSync({ data: t9.data, path: t9.path, parent: n3 });
        if (a3.status === "valid") return a3;
        a3.status === "dirty" && !e11 && (e11 = { result: a3, ctx: n3 }), n3.common.issues.length && r3.push(n3.common.issues);
      }
      if (e11) return t9.common.issues.push(...e11.ctx.common.issues), e11.result;
      let a2 = r3.map((e12) => new o(e12));
      return d(t9, { code: i.invalid_union, unionErrors: a2 }), p;
    }
  }
  get options() {
    return this._def.options;
  }
};
I.create = (e10, t9) => new I({ options: e10, typeName: $.ZodUnion, ...y(t9) });
var L = (t9) => t9 instanceof H ? L(t9.schema) : t9 instanceof q ? L(t9.innerType()) : t9 instanceof U ? [t9.value] : t9 instanceof W ? t9.options : t9 instanceof G ? e.objectValues(t9.enum) : t9 instanceof X ? L(t9._def.innerType) : t9 instanceof D ? [void 0] : t9 instanceof O ? [null] : t9 instanceof J ? [void 0, ...L(t9.unwrap())] : t9 instanceof Y ? [null, ...L(t9.unwrap())] : t9 instanceof Re || t9 instanceof Q ? L(t9.unwrap()) : t9 instanceof Z ? L(t9._def.innerType) : [];
var je = class e4 extends b {
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10);
    if (t9.parsedType !== n.object) return d(t9, { code: i.invalid_type, expected: n.object, received: t9.parsedType }), p;
    let r2 = this.discriminator, a2 = t9.data[r2], o2 = this.optionsMap.get(a2);
    return o2 ? t9.common.async ? o2._parseAsync({ data: t9.data, path: t9.path, parent: t9 }) : o2._parseSync({ data: t9.data, path: t9.path, parent: t9 }) : (d(t9, { code: i.invalid_union_discriminator, options: Array.from(this.optionsMap.keys()), path: [r2] }), p);
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(t9, n2, r2) {
    let i2 = /* @__PURE__ */ new Map();
    for (let e10 of n2) {
      let n3 = L(e10.shape[t9]);
      if (!n3.length) throw Error(`A discriminator value for key \`${t9}\` could not be extracted from all schema options`);
      for (let r3 of n3) {
        if (i2.has(r3)) throw Error(`Discriminator property ${String(t9)} has duplicate value ${String(r3)}`);
        i2.set(r3, e10);
      }
    }
    return new e4({ typeName: $.ZodDiscriminatedUnion, discriminator: t9, options: n2, optionsMap: i2, ...y(r2) });
  }
};
function Me(t9, i2) {
  let a2 = r(t9), o2 = r(i2);
  if (t9 === i2) return { valid: !0, data: t9 };
  if (a2 === n.object && o2 === n.object) {
    let n2 = e.objectKeys(i2), r2 = e.objectKeys(t9).filter((e10) => n2.indexOf(e10) !== -1), a3 = { ...t9, ...i2 };
    for (let e10 of r2) {
      let n3 = Me(t9[e10], i2[e10]);
      if (!n3.valid) return { valid: !1 };
      a3[e10] = n3.data;
    }
    return { valid: !0, data: a3 };
  }
  if (a2 === n.array && o2 === n.array) {
    if (t9.length !== i2.length) return { valid: !1 };
    let e10 = [];
    for (let n2 = 0; n2 < t9.length; n2++) {
      let r2 = t9[n2], a3 = i2[n2], o3 = Me(r2, a3);
      if (!o3.valid) return { valid: !1 };
      e10.push(o3.data);
    }
    return { valid: !0, data: e10 };
  }
  return a2 === n.date && o2 === n.date && +t9 == +i2 ? { valid: !0, data: t9 } : { valid: !1 };
}
var R = class extends b {
  _parse(e10) {
    let { status: t9, ctx: n2 } = this._processInputParams(e10), r2 = (e11, r3) => {
      if (re(e11) || re(r3)) return p;
      let a2 = Me(e11.value, r3.value);
      return a2.valid ? ((ie(e11) || ie(r3)) && t9.dirty(), { status: t9.value, value: a2.data }) : (d(n2, { code: i.invalid_intersection_types }), p);
    };
    return n2.common.async ? Promise.all([this._def.left._parseAsync({ data: n2.data, path: n2.path, parent: n2 }), this._def.right._parseAsync({ data: n2.data, path: n2.path, parent: n2 })]).then(([e11, t10]) => r2(e11, t10)) : r2(this._def.left._parseSync({ data: n2.data, path: n2.path, parent: n2 }), this._def.right._parseSync({ data: n2.data, path: n2.path, parent: n2 }));
  }
};
R.create = (e10, t9, n2) => new R({ left: e10, right: t9, typeName: $.ZodIntersection, ...y(n2) });
var z = class e5 extends b {
  _parse(e10) {
    let { status: t9, ctx: r2 } = this._processInputParams(e10);
    if (r2.parsedType !== n.array) return d(r2, { code: i.invalid_type, expected: n.array, received: r2.parsedType }), p;
    if (r2.data.length < this._def.items.length) return d(r2, { code: i.too_small, minimum: this._def.items.length, inclusive: !0, exact: !1, type: "array" }), p;
    !this._def.rest && r2.data.length > this._def.items.length && (d(r2, { code: i.too_big, maximum: this._def.items.length, inclusive: !0, exact: !1, type: "array" }), t9.dirty());
    let a2 = [...r2.data].map((e11, t10) => {
      let n2 = this._def.items[t10] || this._def.rest;
      return n2 ? n2._parse(new v(r2, e11, r2.path, t10)) : null;
    }).filter((e11) => !!e11);
    return r2.common.async ? Promise.all(a2).then((e11) => f.mergeArray(t9, e11)) : f.mergeArray(t9, a2);
  }
  get items() {
    return this._def.items;
  }
  rest(t9) {
    return new e5({ ...this._def, rest: t9 });
  }
};
z.create = (e10, t9) => {
  if (!Array.isArray(e10)) throw Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new z({ items: e10, typeName: $.ZodTuple, rest: null, ...y(t9) });
};
var Ne = class e6 extends b {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e10) {
    let { status: t9, ctx: r2 } = this._processInputParams(e10);
    if (r2.parsedType !== n.object) return d(r2, { code: i.invalid_type, expected: n.object, received: r2.parsedType }), p;
    let a2 = [], o2 = this._def.keyType, s2 = this._def.valueType;
    for (let e11 in r2.data) a2.push({ key: o2._parse(new v(r2, e11, r2.path, e11)), value: s2._parse(new v(r2, r2.data[e11], r2.path, e11)), alwaysSet: e11 in r2.data });
    return r2.common.async ? f.mergeObjectAsync(t9, a2) : f.mergeObjectSync(t9, a2);
  }
  get element() {
    return this._def.valueType;
  }
  static create(t9, n2, r2) {
    return n2 instanceof b ? new e6({ keyType: t9, valueType: n2, typeName: $.ZodRecord, ...y(r2) }) : new e6({ keyType: x.create(), valueType: t9, typeName: $.ZodRecord, ...y(n2) });
  }
};
var B = class extends b {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e10) {
    let { status: t9, ctx: r2 } = this._processInputParams(e10);
    if (r2.parsedType !== n.map) return d(r2, { code: i.invalid_type, expected: n.map, received: r2.parsedType }), p;
    let a2 = this._def.keyType, o2 = this._def.valueType, s2 = [...r2.data.entries()].map(([e11, t10], n2) => ({ key: a2._parse(new v(r2, e11, r2.path, [n2, "key"])), value: o2._parse(new v(r2, t10, r2.path, [n2, "value"])) }));
    if (r2.common.async) {
      let e11 = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (let n2 of s2) {
          let r3 = await n2.key, i2 = await n2.value;
          if (r3.status === "aborted" || i2.status === "aborted") return p;
          (r3.status === "dirty" || i2.status === "dirty") && t9.dirty(), e11.set(r3.value, i2.value);
        }
        return { status: t9.value, value: e11 };
      });
    }
    {
      let e11 = /* @__PURE__ */ new Map();
      for (let n2 of s2) {
        let r3 = n2.key, i2 = n2.value;
        if (r3.status === "aborted" || i2.status === "aborted") return p;
        (r3.status === "dirty" || i2.status === "dirty") && t9.dirty(), e11.set(r3.value, i2.value);
      }
      return { status: t9.value, value: e11 };
    }
  }
};
B.create = (e10, t9, n2) => new B({ valueType: t9, keyType: e10, typeName: $.ZodMap, ...y(n2) });
var V = class e7 extends b {
  _parse(e10) {
    let { status: t9, ctx: r2 } = this._processInputParams(e10);
    if (r2.parsedType !== n.set) return d(r2, { code: i.invalid_type, expected: n.set, received: r2.parsedType }), p;
    let a2 = this._def;
    a2.minSize !== null && r2.data.size < a2.minSize.value && (d(r2, { code: i.too_small, minimum: a2.minSize.value, type: "set", inclusive: !0, exact: !1, message: a2.minSize.message }), t9.dirty()), a2.maxSize !== null && r2.data.size > a2.maxSize.value && (d(r2, { code: i.too_big, maximum: a2.maxSize.value, type: "set", inclusive: !0, exact: !1, message: a2.maxSize.message }), t9.dirty());
    let o2 = this._def.valueType;
    function s2(e11) {
      let n2 = /* @__PURE__ */ new Set();
      for (let r3 of e11) {
        if (r3.status === "aborted") return p;
        r3.status === "dirty" && t9.dirty(), n2.add(r3.value);
      }
      return { status: t9.value, value: n2 };
    }
    let c2 = [...r2.data.values()].map((e11, t10) => o2._parse(new v(r2, e11, r2.path, t10)));
    return r2.common.async ? Promise.all(c2).then((e11) => s2(e11)) : s2(c2);
  }
  min(t9, n2) {
    return new e7({ ...this._def, minSize: { value: t9, message: _.toString(n2) } });
  }
  max(t9, n2) {
    return new e7({ ...this._def, maxSize: { value: t9, message: _.toString(n2) } });
  }
  size(e10, t9) {
    return this.min(e10, t9).max(e10, t9);
  }
  nonempty(e10) {
    return this.min(1, e10);
  }
};
V.create = (e10, t9) => new V({ valueType: e10, minSize: null, maxSize: null, typeName: $.ZodSet, ...y(t9) });
var Pe = class e8 extends b {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10);
    if (t9.parsedType !== n.function) return d(t9, { code: i.invalid_type, expected: n.function, received: t9.parsedType }), p;
    function r2(e11, n2) {
      return u({ data: e11, path: t9.path, errorMaps: [t9.common.contextualErrorMap, t9.schemaErrorMap, l(), s].filter((e12) => !!e12), issueData: { code: i.invalid_arguments, argumentsError: n2 } });
    }
    function a2(e11, n2) {
      return u({ data: e11, path: t9.path, errorMaps: [t9.common.contextualErrorMap, t9.schemaErrorMap, l(), s].filter((e12) => !!e12), issueData: { code: i.invalid_return_type, returnTypeError: n2 } });
    }
    let c2 = { errorMap: t9.common.contextualErrorMap }, ee2 = t9.data;
    if (this._def.returns instanceof K) {
      let e11 = this;
      return m(async function(...t10) {
        let n2 = new o([]), i2 = await e11._def.args.parseAsync(t10, c2).catch((e12) => {
          throw n2.addIssue(r2(t10, e12)), n2;
        }), s2 = await Reflect.apply(ee2, this, i2);
        return await e11._def.returns._def.type.parseAsync(s2, c2).catch((e12) => {
          throw n2.addIssue(a2(s2, e12)), n2;
        });
      });
    }
    {
      let e11 = this;
      return m(function(...t10) {
        let n2 = e11._def.args.safeParse(t10, c2);
        if (!n2.success) throw new o([r2(t10, n2.error)]);
        let i2 = Reflect.apply(ee2, this, n2.data), s2 = e11._def.returns.safeParse(i2, c2);
        if (!s2.success) throw new o([a2(i2, s2.error)]);
        return s2.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...t9) {
    return new e8({ ...this._def, args: z.create(t9).rest(A.create()) });
  }
  returns(t9) {
    return new e8({ ...this._def, returns: t9 });
  }
  implement(e10) {
    return this.parse(e10);
  }
  strictImplement(e10) {
    return this.parse(e10);
  }
  static create(t9, n2, r2) {
    return new e8({ args: t9 || z.create([]).rest(A.create()), returns: n2 || A.create(), typeName: $.ZodFunction, ...y(r2) });
  }
};
var H = class extends b {
  get schema() {
    return this._def.getter();
  }
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10);
    return this._def.getter()._parse({ data: t9.data, path: t9.path, parent: t9 });
  }
};
H.create = (e10, t9) => new H({ getter: e10, typeName: $.ZodLazy, ...y(t9) });
var U = class extends b {
  _parse(e10) {
    if (e10.data !== this._def.value) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { received: t9.data, code: i.invalid_literal, expected: this._def.value }), p;
    }
    return { status: "valid", value: e10.data };
  }
  get value() {
    return this._def.value;
  }
};
U.create = (e10, t9) => new U({ value: e10, typeName: $.ZodLiteral, ...y(t9) });
function Fe(e10, t9) {
  return new W({ values: e10, typeName: $.ZodEnum, ...y(t9) });
}
var W = class t8 extends b {
  _parse(t9) {
    if (typeof t9.data != "string") {
      let n2 = this._getOrReturnCtx(t9), r2 = this._def.values;
      return d(n2, { expected: e.joinValues(r2), received: n2.parsedType, code: i.invalid_type }), p;
    }
    if (this._cache ||= new Set(this._def.values), !this._cache.has(t9.data)) {
      let e10 = this._getOrReturnCtx(t9), n2 = this._def.values;
      return d(e10, { received: e10.data, code: i.invalid_enum_value, options: n2 }), p;
    }
    return m(t9.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    let e10 = {};
    for (let t9 of this._def.values) e10[t9] = t9;
    return e10;
  }
  get Values() {
    let e10 = {};
    for (let t9 of this._def.values) e10[t9] = t9;
    return e10;
  }
  get Enum() {
    let e10 = {};
    for (let t9 of this._def.values) e10[t9] = t9;
    return e10;
  }
  extract(e10, n2 = this._def) {
    return t8.create(e10, { ...this._def, ...n2 });
  }
  exclude(e10, n2 = this._def) {
    return t8.create(this.options.filter((t9) => !e10.includes(t9)), { ...this._def, ...n2 });
  }
};
W.create = Fe;
var G = class extends b {
  _parse(t9) {
    let r2 = e.getValidEnumValues(this._def.values), a2 = this._getOrReturnCtx(t9);
    if (a2.parsedType !== n.string && a2.parsedType !== n.number) {
      let t10 = e.objectValues(r2);
      return d(a2, { expected: e.joinValues(t10), received: a2.parsedType, code: i.invalid_type }), p;
    }
    if (this._cache ||= new Set(e.getValidEnumValues(this._def.values)), !this._cache.has(t9.data)) {
      let t10 = e.objectValues(r2);
      return d(a2, { received: a2.data, code: i.invalid_enum_value, options: t10 }), p;
    }
    return m(t9.data);
  }
  get enum() {
    return this._def.values;
  }
};
G.create = (e10, t9) => new G({ values: e10, typeName: $.ZodNativeEnum, ...y(t9) });
var K = class extends b {
  unwrap() {
    return this._def.type;
  }
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10);
    return t9.parsedType !== n.promise && t9.common.async === !1 ? (d(t9, { code: i.invalid_type, expected: n.promise, received: t9.parsedType }), p) : m((t9.parsedType === n.promise ? t9.data : Promise.resolve(t9.data)).then((e11) => this._def.type.parseAsync(e11, { path: t9.path, errorMap: t9.common.contextualErrorMap })));
  }
};
K.create = (e10, t9) => new K({ type: e10, typeName: $.ZodPromise, ...y(t9) });
var q = class extends b {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === $.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(t9) {
    let { status: n2, ctx: r2 } = this._processInputParams(t9), i2 = this._def.effect || null, a2 = { addIssue: (e10) => {
      d(r2, e10), e10.fatal ? n2.abort() : n2.dirty();
    }, get path() {
      return r2.path;
    } };
    if (a2.addIssue = a2.addIssue.bind(a2), i2.type === "preprocess") {
      let e10 = i2.transform(r2.data, a2);
      if (r2.common.async) return Promise.resolve(e10).then(async (e11) => {
        if (n2.value === "aborted") return p;
        let t10 = await this._def.schema._parseAsync({ data: e11, path: r2.path, parent: r2 });
        return t10.status === "aborted" ? p : t10.status === "dirty" || n2.value === "dirty" ? ne(t10.value) : t10;
      });
      {
        if (n2.value === "aborted") return p;
        let t10 = this._def.schema._parseSync({ data: e10, path: r2.path, parent: r2 });
        return t10.status === "aborted" ? p : t10.status === "dirty" || n2.value === "dirty" ? ne(t10.value) : t10;
      }
    }
    if (i2.type === "refinement") {
      let e10 = (e11) => {
        let t10 = i2.refinement(e11, a2);
        if (r2.common.async) return Promise.resolve(t10);
        if (t10 instanceof Promise) throw Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return e11;
      };
      if (r2.common.async === !1) {
        let t10 = this._def.schema._parseSync({ data: r2.data, path: r2.path, parent: r2 });
        return t10.status === "aborted" ? p : (t10.status === "dirty" && n2.dirty(), e10(t10.value), { status: n2.value, value: t10.value });
      }
      return this._def.schema._parseAsync({ data: r2.data, path: r2.path, parent: r2 }).then((t10) => t10.status === "aborted" ? p : (t10.status === "dirty" && n2.dirty(), e10(t10.value).then(() => ({ status: n2.value, value: t10.value }))));
    }
    if (i2.type === "transform") {
      if (r2.common.async === !1) {
        let e10 = this._def.schema._parseSync({ data: r2.data, path: r2.path, parent: r2 });
        if (!h(e10)) return p;
        let t10 = i2.transform(e10.value, a2);
        if (t10 instanceof Promise) throw Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: n2.value, value: t10 };
      }
      return this._def.schema._parseAsync({ data: r2.data, path: r2.path, parent: r2 }).then((e10) => h(e10) ? Promise.resolve(i2.transform(e10.value, a2)).then((e11) => ({ status: n2.value, value: e11 })) : p);
    }
    e.assertNever(i2);
  }
};
(q.create = (e10, t9, n2) => new q({ schema: e10, typeName: $.ZodEffects, effect: t9, ...y(n2) }));
(q.createWithPreprocess = (e10, t9, n2) => new q({ schema: t9, effect: { type: "preprocess", transform: e10 }, typeName: $.ZodEffects, ...y(n2) }));
var J = class extends b {
  _parse(e10) {
    return this._getType(e10) === n.undefined ? m(void 0) : this._def.innerType._parse(e10);
  }
  unwrap() {
    return this._def.innerType;
  }
};
J.create = (e10, t9) => new J({ innerType: e10, typeName: $.ZodOptional, ...y(t9) });
var Y = class extends b {
  _parse(e10) {
    return this._getType(e10) === n.null ? m(null) : this._def.innerType._parse(e10);
  }
  unwrap() {
    return this._def.innerType;
  }
};
Y.create = (e10, t9) => new Y({ innerType: e10, typeName: $.ZodNullable, ...y(t9) });
var X = class extends b {
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10), r2 = t9.data;
    return t9.parsedType === n.undefined && (r2 = this._def.defaultValue()), this._def.innerType._parse({ data: r2, path: t9.path, parent: t9 });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
X.create = (e10, t9) => new X({ innerType: e10, typeName: $.ZodDefault, defaultValue: typeof t9.default == "function" ? t9.default : () => t9.default, ...y(t9) });
var Z = class extends b {
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10), n2 = { ...t9, common: { ...t9.common, issues: [] } }, r2 = this._def.innerType._parse({ data: n2.data, path: n2.path, parent: { ...n2 } });
    return g(r2) ? r2.then((e11) => ({ status: "valid", value: e11.status === "valid" ? e11.value : this._def.catchValue({ get error() {
      return new o(n2.common.issues);
    }, input: n2.data }) })) : { status: "valid", value: r2.status === "valid" ? r2.value : this._def.catchValue({ get error() {
      return new o(n2.common.issues);
    }, input: n2.data }) };
  }
  removeCatch() {
    return this._def.innerType;
  }
};
Z.create = (e10, t9) => new Z({ innerType: e10, typeName: $.ZodCatch, catchValue: typeof t9.catch == "function" ? t9.catch : () => t9.catch, ...y(t9) });
var Ie = class extends b {
  _parse(e10) {
    if (this._getType(e10) !== n.nan) {
      let t9 = this._getOrReturnCtx(e10);
      return d(t9, { code: i.invalid_type, expected: n.nan, received: t9.parsedType }), p;
    }
    return { status: "valid", value: e10.data };
  }
};
Ie.create = (e10) => new Ie({ typeName: $.ZodNaN, ...y(e10) });
var Le = /* @__PURE__ */ Symbol("zod_brand");
var Re = class extends b {
  _parse(e10) {
    let { ctx: t9 } = this._processInputParams(e10), n2 = t9.data;
    return this._def.type._parse({ data: n2, path: t9.path, parent: t9 });
  }
  unwrap() {
    return this._def.type;
  }
};
var ze = class e9 extends b {
  _parse(e10) {
    let { status: t9, ctx: n2 } = this._processInputParams(e10);
    if (n2.common.async) return (async () => {
      let e11 = await this._def.in._parseAsync({ data: n2.data, path: n2.path, parent: n2 });
      return e11.status === "aborted" ? p : e11.status === "dirty" ? (t9.dirty(), ne(e11.value)) : this._def.out._parseAsync({ data: e11.value, path: n2.path, parent: n2 });
    })();
    {
      let e11 = this._def.in._parseSync({ data: n2.data, path: n2.path, parent: n2 });
      return e11.status === "aborted" ? p : e11.status === "dirty" ? (t9.dirty(), { status: "dirty", value: e11.value }) : this._def.out._parseSync({ data: e11.value, path: n2.path, parent: n2 });
    }
  }
  static create(t9, n2) {
    return new e9({ in: t9, out: n2, typeName: $.ZodPipeline });
  }
};
var Q = class extends b {
  _parse(e10) {
    let t9 = this._def.innerType._parse(e10), n2 = (e11) => (h(e11) && (e11.value = Object.freeze(e11.value)), e11);
    return g(t9) ? t9.then((e11) => n2(e11)) : n2(t9);
  }
  unwrap() {
    return this._def.innerType;
  }
};
Q.create = (e10, t9) => new Q({ innerType: e10, typeName: $.ZodReadonly, ...y(t9) });
function Be(e10, t9) {
  let n2 = typeof e10 == "function" ? e10(t9) : typeof e10 == "string" ? { message: e10 } : e10;
  return typeof n2 == "string" ? { message: n2 } : n2;
}
function Ve(e10, t9 = {}, n2) {
  return e10 ? k.create().superRefine((r2, i2) => {
    let a2 = e10(r2);
    if (a2 instanceof Promise) return a2.then((e11) => {
      if (!e11) {
        let e12 = Be(t9, r2), a3 = e12.fatal ?? n2 ?? !0;
        i2.addIssue({ code: "custom", ...e12, fatal: a3 });
      }
    });
    if (!a2) {
      let e11 = Be(t9, r2), a3 = e11.fatal ?? n2 ?? !0;
      i2.addIssue({ code: "custom", ...e11, fatal: a3 });
    }
  }) : k.create();
}
var He = { object: F.lazycreate };
var $;
(function(e10) {
  e10.ZodString = "ZodString", e10.ZodNumber = "ZodNumber", e10.ZodNaN = "ZodNaN", e10.ZodBigInt = "ZodBigInt", e10.ZodBoolean = "ZodBoolean", e10.ZodDate = "ZodDate", e10.ZodSymbol = "ZodSymbol", e10.ZodUndefined = "ZodUndefined", e10.ZodNull = "ZodNull", e10.ZodAny = "ZodAny", e10.ZodUnknown = "ZodUnknown", e10.ZodNever = "ZodNever", e10.ZodVoid = "ZodVoid", e10.ZodArray = "ZodArray", e10.ZodObject = "ZodObject", e10.ZodUnion = "ZodUnion", e10.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", e10.ZodIntersection = "ZodIntersection", e10.ZodTuple = "ZodTuple", e10.ZodRecord = "ZodRecord", e10.ZodMap = "ZodMap", e10.ZodSet = "ZodSet", e10.ZodFunction = "ZodFunction", e10.ZodLazy = "ZodLazy", e10.ZodLiteral = "ZodLiteral", e10.ZodEnum = "ZodEnum", e10.ZodEffects = "ZodEffects", e10.ZodNativeEnum = "ZodNativeEnum", e10.ZodOptional = "ZodOptional", e10.ZodNullable = "ZodNullable", e10.ZodDefault = "ZodDefault", e10.ZodCatch = "ZodCatch", e10.ZodPromise = "ZodPromise", e10.ZodBranded = "ZodBranded", e10.ZodPipeline = "ZodPipeline", e10.ZodReadonly = "ZodReadonly";
})($ ||= {});
var Ue = (e10, t9 = { message: `Input not instance of ${e10.name}` }) => Ve((t10) => t10 instanceof e10, t9);
var We = x.create;
var Ge = S.create;
var Ke = Ie.create;
var qe = C.create;
var Je = w.create;
var Ye = T.create;
var Xe = E.create;
var Ze = D.create;
var Qe = O.create;
var $e = k.create;
var et = A.create;
var tt = j.create;
var nt = M.create;
var rt = N.create;
var it = F.create;
var at = F.strictCreate;
var ot = I.create;
var st = je.create;
var ct = R.create;
var lt = z.create;
var ut = Ne.create;
var dt = B.create;
var ft = V.create;
var pt = Pe.create;
var mt = H.create;
var ht = U.create;
var gt = W.create;
var _t = G.create;
var vt = K.create;
var yt = q.create;
var bt = J.create;
var xt = Y.create;
var St = q.createWithPreprocess;
var Ct = ze.create;
var wt = () => We().optional();
var Tt = () => Ge().optional();
var Et = () => Je().optional();
var Dt = { string: ((e10) => x.create({ ...e10, coerce: !0 })), number: ((e10) => S.create({ ...e10, coerce: !0 })), boolean: ((e10) => w.create({ ...e10, coerce: !0 })), bigint: ((e10) => C.create({ ...e10, coerce: !0 })), date: ((e10) => T.create({ ...e10, coerce: !0 })) };
var Ot = p;
export {Ue as $,Q as A,te as At,M as B,l as Bt,O as C,Xe as Ct,J as D,et as Dt,F as E,ot as Et,z as F,re as Ft,Dt as G,a as Gt,rt as H,s as Ht,b as I,g as It,Ee as J,t as Jt,Ve as K,n as Kt,D as L,ie as Lt,V as M,m as Mt,x as N,f as Nt,ze as O,nt as Ot,E as P,d as Pt,pt as Q,I as R,h as Rt,j as S,We as St,S as T,Ze as Tt,qe as U,o as Ut,$e as V,ee as Vt,Je as W,i as Wt,yt as X,st as Y,e as Yt,gt as Z,H as _,St as _t,C as a,Ke as at,Ie as b,ft as bt,Z as c,Qe as ct,je as d,it as dt,ct as et,q as f,Et as ft,R as g,Ct as gt,Pe as h,wt as ht,N as i,dt as it,Ne as j,p as jt,K as k,ne as kt,T as l,xt as lt,$ as m,bt as mt,Ot as n,mt as nt,w as o,_t as ot,W as p,Tt as pt,Ye as q,r as qt,k as r,ht as rt,Re as s,tt as st,Le as t,He as tt,X as u,Ge as ut,U as v,vt as vt,Y as w,lt as wt,G as x,at as xt,B as y,ut as yt,A as z,u as zt};