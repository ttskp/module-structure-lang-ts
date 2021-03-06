const mocha = require("mocha");
const describe = mocha.describe;
const it = mocha.it;
const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;
const path = require("path");
const providerFactory = require("../../src/typescript-dependency-provider");


describe("typescript-dependency-provider", function() {

    let source = "";
    let actualImportSources = [];
    let expectedImportSources = [];
    let modulePath = "";


    it("should find entire content import", function() {
        givenSource("import * as myModule from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    function givenSource(s) {
        source = s;
    }

    function whenGettingImportSources() {
        let typeScriptDependencyProvider = providerFactory();
        actualImportSources = typeScriptDependencyProvider.getImportSourcesFromString(source);
    }

    function thenImportSourcesShouldEqual(expectedImportSources) {
        expect(actualImportSources).to.deep.equal(expectedImportSources);
    }

    it("should find single member import", function() {
        givenSource("import {myMember} from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should find multiple member import", function() {
        givenSource("import {foo, bar} from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should find aliased member import", function() {
        givenSource("import {reallyReallyLongModuleMemberName as shortName} from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should find aliased multi member import", function() {
        givenSource("import {reallyReallyLongModuleMemberName as shortName, anotherLongModuleName as short} from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should find namespace default import", function() {
        givenSource("import myDefault, * as myModule from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should find specific named default import", function() {
        givenSource("import myDefault, {foo, bar} from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should find multiline imports ", function() {
        givenSource("import {\n\tmyMember,\n\t,anotherMember\r\n    someOtherMember\n}\n from \"my-module\";");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should ignore whitespace ", function() {
        givenSource("import { myMember }\n from \"my-module\" ;");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should ignore comments", function() {
        givenSource("// some info\n /** ... */ import {myMember} from \"my-module\";\n// end of file");
        whenGettingImportSources();
        thenImportSourcesShouldEqual(["my-module.ts"]);
    });

    it("should match multiple modules", function() {
        const source = "import name from \"module-a\";\n"
            + "import * as name from \"module-b\";\n"
            + "import { member } from \"module-c\";\n"
            + "import { member as alias } from \"module-d\";\n"
            + "import { member1 , member2 } from \"module-e\";\n"
            + "import { member1 , member2 as alias2 , [...] } from \"ignored\";\n"
            + "import defaultMember, { member [ , [...] ] } from \"ignored\";\n"
            + "import defaultMember, * as alias from \"module-f\";\n"
            + "import defaultMember from \"module-g\";\n"
            + "import \"module-h\";\n";

        givenSource(source);
        whenGettingImportSources();
        thenImportSourcesShouldEqual([
            "module-a.ts",
            "module-b.ts",
            "module-c.ts",
            "module-d.ts",
            "module-e.ts",
            "module-f.ts",
            "module-g.ts",
            "module-h.ts"
        ]);
    });

    it("should provide imports from file", function() {
        givenModuleFile();
        whenGettingImportSourcesFromFile();
        thenImportSourcesShouldMatchExpectedImportSources();
    });

    function givenModuleFile() {
        modulePath = path.join(__dirname, "../resources/sample.ts");
        expectedImportSources = [
            "./package-a/module-a.ts",
            "./package-a/module-b.ts",
            "./package-a/module-c.ts",
            "./package-b/module-d.ts",
            "./package-b/module-e.ts",
            "./package-b/module-f.ts",
            "./package-b/package-b2/module-g.ts",
            "./package-b/package-b2/module-h.ts",
            "./package-b/package-b2/module-i.ts",
            "./package-b/package-b2/module-j.ts"
        ];
    }

    function whenGettingImportSourcesFromFile() {
        let typeScriptDependencyProvider = providerFactory();
        actualImportSources = typeScriptDependencyProvider.getDependencies(modulePath);
    }

    function thenImportSourcesShouldMatchExpectedImportSources() {
        assert.deepEqual(actualImportSources, expectedImportSources);
    }
});

