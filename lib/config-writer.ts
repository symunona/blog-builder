import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { template } from 'underscore';

const configFileTemplate = template(readFileSync(__dirname + '/config.template', 'utf8'))

export function generateApacheConfig(publicAddress, blogFsRoot) {
    // const SITES_AVAILABLE_CONF_PATH = '/etc/apache2/sites-available'
    const SITES_AVAILABLE_CONF_PATH = join(__dirname, '../conf/')
    const CONF_EXTENSION = '.conf'
    const confFilePath = join(SITES_AVAILABLE_CONF_PATH, publicAddress + CONF_EXTENSION)

    const configFileToBeWritten = configFileTemplate({
        documentRoot: blogFsRoot,
        serverName: publicAddress
    })
    if (!existsSync(SITES_AVAILABLE_CONF_PATH)){
        mkdirSync(SITES_AVAILABLE_CONF_PATH, { recursive: true });
    }

    writeFileSync(confFilePath, configFileToBeWritten)
    console.log(`[Config] Do not forget to enable the site!`)
    console.log(`sudo mv ${confFilePath} /etc/apache2/sites-available/`)
    console.log('sudo ln -s /etc/apache2/sites-available/* /etc/apache2/sites-enabled/')

}

