module.exports = function (script) {
  return "try{ +" + script + " } catch (e) { error(e); }";
}
