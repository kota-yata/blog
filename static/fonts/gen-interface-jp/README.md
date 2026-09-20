# Gen Interface JP

Version: **0.8.0** (standard family, not Display)

Source: https://github.com/yamatoiizuka/gen-interface-jp/releases/tag/v0.8.0

The TTF files are unmodified release assets, renamed for the existing font URLs:

| Release asset | Local file | CSS weight |
| --- | --- | --- |
| GenInterfaceJP-Regular.ttf | regular.ttf | 400 |
| GenInterfaceJP-Medium.ttf | medium.ttf | 500 |
| GenInterfaceJP-SemiBold.ttf | semibold.ttf | 600 |
| GenInterfaceJP-Bold.ttf | bold.ttf | 700 |

License: SIL Open Font License 1.1, included in `OFL.txt`.

Run `npm run build:fonts` to regenerate the ignored `subset/` directory.
When updating the fonts, also update the version query in `src/styles/fonts.scss`
so browsers fetch the new subsets.
