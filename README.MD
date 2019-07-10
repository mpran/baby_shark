### Baby shark
Small chrome extension to help with DO searches

For the extension to work, you must be logged in to digital ocean


#### Chrome Installation

1. Clone this repository
1. In chrome go to More Tools -> extensions
1. Ensure the `Developer mode` toggle is turned on in the upper right corner
1. In the left-top should see Load Unpacked.  Click it.
1. Navigate to where you cloned this repository
1. Select `baby_shark`
1. Get :moneybag: 

#### Firefox Installation

1. Go to the [Firefox developer add-on api key page](https://addons.mozilla.org/en-US/developers/addon/api/key/)
1. Create a new api key and save your token and secret
  1. Save them as environment variables, or copy/paste them in step 5b
1. Clone this repository
1. Install `web-ext` (`npm i -g web-ext`)
1. In this directory (`cd ~/baby_shark`)
  1. `web-ext build`
  1. `web-ext sign --api-key=$AMO_JWT_ISSUER --api-secret=$AMO_JWT_SECRET`
1. Go to `Add-ons` (<kbd>Cmd</kbd> <kbd>Shift</kbd> <kbd>A</kbd>)
1. Gear Icon -> "Install Add-on From File..."
1. Select the file from `~/baby_shark/web-ext-artifacts/baby_shark-1.0-an+fx.xpi`
1. Get :moneybag: 
