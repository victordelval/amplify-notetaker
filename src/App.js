import React, { Component } from 'react';
import { withAuthenticator } from 'aws-amplify-react';

class App extends Component {
  render() {
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-l">Amplify Notetaker</h1>
        <form className="mb3">
          <input 
            type="text" 
            className="pa2 f4"
            placeholder="Write your note" />
          <button className="pa2 f4" type="submit">
            Add Note
          </button>
        </form>
        
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
