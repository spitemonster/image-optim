# Image Opt

Building this for use at Mitosis. There's not really a defined workflow for the designers delivering optimized images, and in addition I'm wanting to move us in the direction of using asynchronous image loading and srcset images on sites we build, so I thought I'd bundle it all together.

Upload a file, this resizes it to desired sizes (options are 320, 480, 960 and 1280, as well as 2560 for retina screens), as long as the original image is bigger than the chosen sizes, and then optimizes and zips them all together.
