# Let's Chat - GitHub Auth Plugin

Add GitHub authentication to [Let's Chat](http://sdelements.github.io/lets-chat/).

### Install (NPM module not yet published)

```
npm install dyerti/lets-chat-github
```

### Configure

###### Example 

```yml
auth:
  providers: [gitlab]

  github:
    clientID: '<Generate this in GitHub>'
    clientSecret: '<Generate this in GitHub>'
    callbackURL: 'https://chat.domain.example/account/github/callback'
```
