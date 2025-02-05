// lgtm[js/unused-local-variable]
import * as browser from "webextension-polyfill";

// Parses a guifont declaration as described in `:h E244`
export function parseGuifont(guifont: string) {
    const options = guifont.split(":");
    const result = { "font-family": options[0] };
    return options.slice(1).reduce((acc, option) => {
            switch (option[0]) {
                case "h":
                    acc["font-size"] = `${option.slice(1)}pt`;
                    break;
                case "b":
                    acc["font-weight"] = "bold";
                    break;
                case "i":
                    acc["font-style"] = "italic";
                    break;
                case "u":
                    acc["text-decoration"] = "underline";
                    break;
                case "s":
                    acc["text-decoration"] = "line-through";
                    break;
                case "w": // Can't set font width. Would have to adjust cell width.
                case "c": // Can't set character set
                    break;
            }
            return acc;
        }, result as any);
}

export function guifontToMultiDecl(guifont: string) {
    return Object.entries(parseGuifont(guifont))
        .map(([key, value]) => `${key}: ${value};\n`)
        .join("\n");
}

export function guifontsToFontFamily(guifonts: string[]) {
    return "font-family: " + guifonts
        .map(guifont => parseGuifont(guifont)["font-family"])
        .join(", ") + ";";
}

export function guifontsToCSS(guifont: string) {
    const guifonts = (guifont + ",")
        .match(/.+?[^\\],/g) // split on non-escaped commas
        .map(s => s.slice(0, -1)); // remove last comma of each font
    if (guifonts.length > 1) {
        // If there are multiple font declarations, we use a CSS declaration
        // like this: `font-family: font-family1 font-size font-style
        // font-weight, font-family2...`. This prevents us from setting
        // size/bold/italics/underlnie/strikethrough but enables letting the
        // browser fallback to other fonts if one can't be found.
        return guifontsToFontFamily(guifonts);
    }
    return guifontToMultiDecl(guifonts[0]);
}

export function computeSelector(element: HTMLElement) {
    function uniqueSelector(e: HTMLElement): string {
        // Only matching alphanumeric selectors because others chars might have special meaning in CSS
        if (e.id && e.id.match("^[a-zA-Z0-9_-]+$")) { return "#" + e.id; }
        // If we reached the top of the document
        if (!e.parentElement) { return "HTML"; }
        // Compute the position of the element
        const index =
            Array.from(e.parentElement.children)
                .filter(child => child.tagName === e.tagName)
                .indexOf(e) + 1;
        return `${uniqueSelector(e.parentElement)} > ${e.tagName}:nth-of-type(${index})`;
    }
    return uniqueSelector(element);
}

export function toHexCss(n: number) {
    const str = n.toString(16);
    // Pad with leading zeros
    return "#" + (new Array(6 - str.length)).fill("0").join("") + str;
}

export function toHighlightClassName(n: number) {
    return "nvim_highlight_" + n;
}

export function toCss(highlights: HighlightArray) {
    const bg = highlights[0].background;
    const fg = highlights[0].foreground;
    return highlights.reduce((css, elem, id) => css +
        `.${toHighlightClassName(id)} { background: ${elem.background || bg}; color: ${elem.foreground || fg}; }`
        , "");
}
