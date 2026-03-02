roles for the new openai "responses" api:<br>
developer, user, assistant


```js
const models = await client.models.list();
for (const model of models.data) {
  console.log(`Model: ${model.id}`);
}
try {
  /*
    roles:
    { role, content } // authority decreases in this order:
    - system: global premises
    - developer: feature level premises. tool use rules.
    - user: the user's input
    - assistant: the assistant's response
    - tool: the tool's response
    { role, name, input }
    - function
  */
}
```
