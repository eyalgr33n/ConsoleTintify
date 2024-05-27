class consoletintify {
    constructor() {
        this.codes = {
            modifiers: {
                reset: '\x1b[0m',
                bold: '\x1b[1m',
                dim: '\x1b[2m',
                italic: '\x1b[3m',
                underline: '\x1b[4m',
                blink: '\x1b[5m',
                inverse: '\x1b[7m',
                hidden: '\x1b[8m',
                strikethrough: '\x1b[9m'
            },
            colors: {
                black: 30, red: 31, green: 32, yellow: 33,
                blue: 34, magenta: 35, cyan: 36, white: 37,
                blackBright: 90, redBright: 91, greenBright: 92, yellowBright: 93,
                blueBright: 94, magentaBright: 95, cyanBright: 96, whiteBright: 97
            }
        };

        return new Proxy(this, {
            get: (target, prop) => target.createMethods(prop) || target[prop]
        });
    }

    static get colors() {
        return new Proxy({}, {
            get: (target, color) => {
                const tintify = new consoletintify();
                if (color in tintify.codes.colors) {
                    return (text) => tintify.createFormatter(`\x1b[${tintify.codes.colors[color]}m`)(text);
                }
                if (color.startsWith('bg')) {
                    const baseColor = color.slice(2).toLowerCase();
                    if (baseColor in tintify.codes.colors) {
                        return (text) => tintify.createFormatter(`\x1b[${tintify.codes.colors[baseColor] + 10}m`)(text);
                    }
                }
            }
        });
    }

    createMethods(color) {
        const code = this.codes.colors[color];
        if (code !== undefined) {
            return this.createFormatter(`\x1b[${code}m`);
        } else if (color.startsWith('bg')) {
            const baseColor = color.slice(2).toLowerCase();
            const bgcolorcode = this.codes.colors[baseColor];
            if (bgcolorcode !== undefined) {
                return this.createFormatter(`\x1b[${bgcolorcode + 10}m`);
            }
        }
    }

    createFormatter(ansi) {
        const formatter = (text) => `${ansi}${text}${this.codes.modifiers.reset}`;
        return new Proxy(formatter, {
            get: (target, modifier) => {
                if (modifier in this.codes.modifiers) {
                    return this.createFormatter(`${ansi}${this.codes.modifiers[modifier]}`);
                }
                if (modifier === 'hex') return (hex) => this.hex(hex, ansi);
                if (modifier === 'rgb') return (r, g, b) => this.rgb(r, g, b, ansi);
                if (modifier === 'bghex') return (hex) => this.bghex(hex, ansi);
                if (modifier === 'bgrgb') return (r, g, b) => this.bgrgb(r, g, b, ansi);
            }
        });
    }

    hex(hex, ansi = '') {
        const [r, g, b] = this.hextorgb(hex);
        return this.createFormatter(`${ansi}\x1b[38;2;${r};${g};${b}m`);
    }

    bghex(hex, ansi = '') {
        const [r, g, b] = this.hextorgb(hex);
        return this.createFormatter(`${ansi}\x1b[48;2;${r};${g};${b}m`);
    }

    rgb(r, g, b, ansi = '') {
        return this.createFormatter(`${ansi}\x1b[38;2;${r};${g};${b}m`);
    }

    bgrgb(r, g, b, ansi = '') {
        return this.createFormatter(`${ansi}\x1b[48;2;${r};${g};${b}m`);
    }

    hextorgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }
}

module.exports = consoletintify;

const consoletintify2 = new consoletintify();

module.exports = new Proxy(consoletintify2, {
    get: (target, prop) => target.createMethods(prop) || target[prop]
});
