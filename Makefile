images: .FORCE
	inkscape --export-type=png --export-width=16 --export-height=16 --export-filename=images/icon16.png images/icon.svg
	inkscape --export-type=png --export-width=32 --export-height=32 --export-filename=images/icon32.png images/icon.svg
	inkscape --export-type=png --export-width=96 --export-height=96 --export-filename=images/icon96.png images/icon.svg
	inkscape --export-type=png --export-width=128 --export-height=128 --export-filename=images/icon128.png images/icon.svg
	inkscape --export-type=png --export-filename=images/chrome-promotion-tile.png images/chrome-promotion-tile.svg
	convert images/icon96.png -background 'rgba(0,0,0,0)' -gravity center -extent 128x128 images/chrome-icon-store.png
	convert images/MainControl.png -resize 640x -background white -gravity center -extent 640x400 images/chrome-screenshot.png

chrome: .FORCE
	(cd dist/chrome/; zip -r search-blocker.zip *)

.FORCE:
.PHONY: chrome
