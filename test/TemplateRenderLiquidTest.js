import test from "ava";
import TemplateRender from "../src/TemplateRender";

// Liquid
test("Liquid", t => {
  t.is(new TemplateRender("liquid").getEngineName(), "liquid");
});

test("Liquid Render (with Helper)", async t => {
  let fn = await new TemplateRender("liquid").getCompiledTemplate(
    "<p>{{name | capitalize}}</p>"
  );
  t.is(await fn({ name: "tim" }), "<p>Tim</p>");
});

test("Liquid Render Include", async t => {
  t.is(new TemplateRender("liquid", "./test/stubs/").getEngineName(), "liquid");

  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate("<p>{% include included %}</p>");
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include with Liquid Suffix", async t => {
  t.is(new TemplateRender("liquid", "./test/stubs/").getEngineName(), "liquid");

  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate("<p>{% include included.liquid %}</p>");
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include with HTML Suffix", async t => {
  t.is(new TemplateRender("liquid", "./test/stubs/").getEngineName(), "liquid");

  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate("<p>{% include included.html %}</p>");
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include with HTML Suffix and Data Pass in", async t => {
  t.is(new TemplateRender("liquid", "./test/stubs/").getEngineName(), "liquid");

  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(
    "{% include included-data.html, myVariable: 'myValue' %}"
  );
  t.is((await fn()).trim(), "This is an include. myValue");
});

test("Liquid Custom Filter", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addFilter("prefixWithZach", function(val) {
    return "Zach" + val;
  });

  t.is(await tr.render("{{ 'test' | prefixWithZach }}", {}), "Zachtest");
});

test("Liquid Custom Tag prefixWithZach", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addTag("prefixWithZach", function(liquidEngine) {
    return {
      parse: function(tagToken, remainTokens) {
        this.str = tagToken.args; // name
      },
      render: function(scope, hash) {
        var str = liquidEngine.evalValue(this.str, scope); // 'alice'
        return Promise.resolve("Zach" + str); // 'Alice'
      }
    };
  });

  t.is(
    await tr.render("{% prefixWithZach name %}", { name: "test" }),
    "Zachtest"
  );
});

test("Liquid Custom Tag postfixWithZach", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addTag("postfixWithZach", function(liquidEngine) {
    return {
      parse: function(tagToken, remainTokens) {
        this.str = tagToken.args;
      },
      render: function(scope, hash) {
        var str = liquidEngine.evalValue(this.str, scope);
        return Promise.resolve(str + "Zach");
      }
    };
  });

  t.is(
    await tr.render("{% postfixWithZach name %}", { name: "test" }),
    "testZach"
  );
});

test("Liquid addTag errors", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  t.throws(() => {
    tr.engine.addTag("badSecondArgument", {});
  });
});

test("Liquid addTags", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addCustomTags({
    postfixWithZach: function(liquidEngine) {
      return {
        parse: function(tagToken, remainTokens) {
          this.str = tagToken.args;
        },
        render: function(scope, hash) {
          var str = liquidEngine.evalValue(this.str, scope);
          return Promise.resolve(str + "Zach");
        }
      };
    }
  });

  t.is(
    await tr.render("{% postfixWithZach name %}", { name: "test" }),
    "testZach"
  );
});

test("Liquid Shortcode", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addShortcode("postfixWithZach", function(str) {
    return str + "Zach";
  });

  t.is(
    await tr.render("{% postfixWithZach name %}", { name: "test" }),
    "testZach"
  );
});

test("Liquid Shortcode Safe Output", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addShortcode("postfixWithZach", function(str) {
    return `<span>${str}</span>`;
  });

  t.is(
    await tr.render("{% postfixWithZach name %}", { name: "test" }),
    "<span>test</span>"
  );
});

test("Liquid Paired Shortcode", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addPairedShortcode("postfixWithZach", function(content, str) {
    return str + content + "Zach";
  });

  t.is(
    await tr.render(
      "{% postfixWithZach name %}Content{% endpostfixWithZach %}",
      { name: "test" }
    ),
    "testContentZach"
  );
});

test("Liquid Render Include Subfolder", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include subfolder/included.liquid %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder HTML", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include subfolder/included.html %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder No file extension", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include subfolder/included %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

// Skipped tests pending https://github.com/harttle/liquidjs/issues/61
// Resolution: we’re going to leave this skipped as LiquidJS will require dynamicPartials
// to be on for quoted includes!
test.skip("Liquid Render Include Subfolder Single quotes", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include 'subfolder/included.liquid' %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test.skip("Liquid Render Include Subfolder Double quotes", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include "subfolder/included.liquid" %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test.skip("Liquid Render Include Subfolder Single quotes HTML", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include 'subfolder/included.html' %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test.skip("Liquid Render Include Subfolder Double quotes HTML", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include "subfolder/included.html" %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test.skip("Liquid Render Include Subfolder Single quotes No file extension", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include 'subfolder/included' %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});

test.skip("Liquid Render Include Subfolder Double quotes No file extension", async t => {
  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate(`<p>{% include "subfolder/included" %}</p>`);
  t.is(await fn(), "<p>This is an include.</p>");
});
/* End skipped tests */

test("Liquid Options Overrides", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let options = tr.engine.getLiquidOptions();
  t.is(options.dynamicPartials, true);
});

test("Liquid Render Include Subfolder Single quotes no extension dynamicPartials true", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include 'subfolder/included' %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Double quotes no extension dynamicPartials true", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include "subfolder/included" %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Single quotes dynamicPartials true", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include 'subfolder/included.liquid' %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Double quotes dynamicPartials true", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include "subfolder/included.liquid" %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Single quotes HTML dynamicPartials true", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include 'subfolder/included.html' %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Double quotes HTML dynamicPartials true", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include "subfolder/included.html" %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Single quotes HTML dynamicPartials true, data passed in", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include 'subfolder/included.html', myVariable: 'myValue' %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render Include Subfolder Double quotes HTML dynamicPartials true, data passed in", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ dynamicPartials: true });

  let fn = await tr.getCompiledTemplate(
    `<p>{% include "subfolder/included.html", myVariable: "myValue" %}</p>`
  );
  t.is(await fn(), "<p>This is an include.</p>");
});

test("Liquid Render: with Library Override", async t => {
  let tr = new TemplateRender("liquid");

  let lib = require("liquidjs")();
  tr.engine.setLibrary(lib);

  let fn = await tr.getCompiledTemplate("<p>{{name | capitalize}}</p>");
  t.is(await fn({ name: "tim" }), "<p>Tim</p>");
});

test("Liquid Paired Shortcode with Tag Inside", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addPairedShortcode("postfixWithZach", function(content, str) {
    return str + content + "Zach";
  });

  t.is(
    await tr.render(
      "{% postfixWithZach name %}Content{% if tester %}If{% endif %}{% endpostfixWithZach %}",
      { name: "test", tester: true }
    ),
    "testContentIfZach"
  );
});

test("Liquid Nested Paired Shortcode", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addPairedShortcode("postfixWithZach", function(content, str) {
    return str + content + "Zach";
  });

  t.is(
    await tr.render(
      "{% postfixWithZach name %}Content{% postfixWithZach name2 %}Content{% endpostfixWithZach %}{% endpostfixWithZach %}",
      { name: "test", name2: "test2" }
    ),
    "testContenttest2ContentZachZach"
  );
});

test("Liquid Shortcode Multiple Args", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addShortcode("postfixWithZach", function(str, str2) {
    return str + str2 + "Zach";
  });

  t.is(
    await tr.render("{% postfixWithZach name other %}", {
      name: "test",
      other: "howdy"
    }),
    "testhowdyZach"
  );
});

test.skip("Liquid Include Scope Leak", async t => {
  t.is(new TemplateRender("liquid", "./test/stubs/").getEngineName(), "liquid");

  let fn = await new TemplateRender(
    "liquid",
    "./test/stubs/"
  ).getCompiledTemplate("<p>{% include scopeleak %}{{ test }}</p>");
  t.is(await fn({ test: 1 }), "<p>21</p>");
});

// TODO this will change in 1.0
test("Liquid Missing Filter Issue #183 (no strict_filters)", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");

  try {
    await tr.render("{{ 'test' | prefixWithZach }}", {});
    t.pass("Did not error.");
  } catch (e) {
    t.fail("Threw an error.");
  }
});

test("Liquid Missing Filter Issue #183", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.setLiquidOptions({ strict_filters: true });

  try {
    await tr.render("{{ 'test' | prefixWithZach }}", {});
    t.fail("Did not error.");
  } catch (e) {
    t.pass("Threw an error.");
  }
});

test("Issue 258: Liquid Render Date", async t => {
  let fn = await new TemplateRender("liquid").getCompiledTemplate(
    "<p>{{ myDate }}</p>"
  );
  let dateStr = await fn({ myDate: new Date(Date.UTC(2016, 0, 1, 0, 0, 0)) });
  t.is(dateStr.substr(0, 3), "<p>");
  t.is(dateStr.substr(-4), "</p>");
  t.not(dateStr.substr(2, 1), '"');
});

test("Issue 347: Liquid addTags with space in argument", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addCustomTags({
    issue347CustomTag: function(liquidEngine) {
      return {
        parse: function(tagToken, remainTokens) {
          this.str = tagToken.args;
        },
        render: function(scope, hash) {
          var str = liquidEngine.evalValue(this.str, scope);
          return Promise.resolve(str + "Zach");
        }
      };
    }
  });

  t.is(
    await tr.render("{% issue347CustomTag 'te st' %}", {
      name: "slkdjflksdjf"
    }),
    "te stZach"
  );
});

test("Issue 347: Liquid Shortcode, string argument", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addShortcode("issue347", function(str) {
    return str + "Zach";
  });

  t.is(
    await tr.render("{% issue347 'test' %}", { name: "alkdsjfkslja" }),
    "testZach"
  );
});

test("Issue 347: Liquid Shortcode string argument with space, double quotes", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addShortcode("issue347b", function(str) {
    return str + "Zach";
  });

  t.is(
    await tr.render('{% issue347b "test 2" "test 3" %}', {
      name: "alkdsjfkslja"
    }),
    "test 2Zach"
  );
});

test.skip("Issue 347: Liquid Shortcode string argument with space, single quotes", async t => {
  let tr = new TemplateRender("liquid", "./test/stubs/");
  tr.engine.addShortcode("issue347", function(str) {
    return str + "Zach";
  });

  t.is(
    await tr.render("{% issue347 'test 2' %}", { name: "alkdsjfkslja" }),
    "test 2Zach"
  );
});
