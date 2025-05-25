import fs from 'fs';
import path from 'path';

interface ContentScript {
    matches: string[];
    js: string[];
    run_at: string;
}

interface Manifest {
    content_scripts: ContentScript[];
    [key: string]: any;
}

function updateManifest(): void {
    const manifestPath = path.join(process.cwd(), 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
        console.error('❌ manifest.json not found');
        return;
    }

    try {
        const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        if (!manifest.content_scripts) {
            manifest.content_scripts = [];
        }

        const validatorScriptExists = manifest.content_scripts.some(
            script => script.js.some(jsFile => jsFile.includes('validators/index'))
        );

        if (!validatorScriptExists) {
            const validatorScript: ContentScript = {
                matches: ["https://*.chatgpt.com/*"],
                js: ["src/content-scripts/validators/index.ts"],
                run_at: "document_idle"
            };

            manifest.content_scripts.push(validatorScript);

            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log('✅ Manifest updated with validator system');
            console.log('📝 Added content script: src/content-scripts/validators/index.ts');
        } else {
            console.log('✅ Validator system already registered in manifest');
        }

        console.log('\n📋 Current content scripts:');
        manifest.content_scripts.forEach((script, index) => {
            console.log(`  ${index + 1}. ${script.js.join(', ')} (${script.run_at})`);
        });

    } catch (error) {
        console.error('❌ Failed to update manifest:', error);
    }
}

if (require.main === module) {
    updateManifest();
}

export { updateManifest }; 