# Slack old member purger

** THIS IS THROWAWAY CODE **

I'm just putting it on github for sharing with friends.

Basically I want a way to clear out old users from a Slack board, and this is my stab at doing it.

It has hardcoded channel ids and the like - don't run this without modifying for your own needs!

To run it, you need a slack token for an installed app with all the right permissions, then:

```
export SLACK_TOKEN=xoxp-NNNN-NNNN
node main.js
```

Unless you change the code to turn off previewMode, nothing will happen but logs.

## TODO
- check for user behaviour before purging

--

Copyright © 2020 Kornelis Sietsma <korny@sietsma.com>
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See the COPYING file for more details.
