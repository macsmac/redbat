# Example: tcp-wrapper

This example contains event-based tcp-wrapper client and server.

> **Note:** There is a cool crunch with `setTimeout` here, so...

> **TODO for RedBat:** Collect event queue and emit them only when all work is finished (here, when outputStream will open) 
