const parserValuesRef = {
 map(name) {
 return { _routes: JSON.stringify(this.routeAliases) }[name];
 },
 routes: {},
 routeAliases: {},
 exportValues: [
 "$attrs",
 "$onBeforeUpdate",
 "$onAfterUpdate",
 "$element",
 "$elements",
 "$reason",
 "$",
 "$P",
 "$B",
 "$$",
 "$$P",
 "$H",
 "$$H",
 "$this",
 "$document",
 "out",
 "$navigate",
 "$api",
 "$types",
 ].join(", "),
};
export default parserValuesRef;