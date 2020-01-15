var Router = ReactRouter;
var Route = Router.Route, DefaultRoute = Router.DefaultRoute,
  Link=Router.Link, RouteHandler = Router.RouteHandler;



// define(function(require, exports, module){
//     require('Route')
// });



class LoginPage extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            username: '',
            password: ''
        }
        
        this.usernameChange = this.usernameChange.bind(this);
        this.passwordChange = this.passwordChange.bind(this);
        this.loginButton = this.loginButton.bind(this);
        this.createAccountButton = this.createAccountButton.bind(this);
    }
    usernameChange(event){
        this.setState({username: event.target.value});
    }
    passwordChange(event){
        this.setState({password: event.target.value});
    }
    loginButton(event){
        event.preventDefault();

        fetch('http://ec2-18-191-88-213.us-east-2.compute.amazonaws.com:3456', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request: "login",
                username: this.state.username,
                password: this.state.password
            })
            
        }).then(res => res.json())
        .then(response => {
            if(response.login_status === "success"){
                console.log(response);
                //Router.push('/home');
                //navigates to /home.js
                document.location.href="home.html"
                
                
            }
            else {
                this.setState({
                    username: '',
                    password: ''
                });
                alert("Sorry! Bad username or password.");
            }
        })
        .catch(error => console.error("Error: ",error));
    }
    createAccountButton(event){
        event.preventDefault();
        console.log("fetching!");
        //TODO implement account creation
        fetch('http://ec2-18-191-88-213.us-east-2.compute.amazonaws.com:3456', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request: "create_account",
                username: this.state.username,
                password: this.state.password
            })
        })
        .catch(error => console.error("Error: ",error));
    }
    render() { return (
    <div style={loginDivStyle}>
        
        <h2>Login or Sign Up</h2>
        <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet"></link>
        <input style={loginChildStyle} placeholder="Username..." type="text" value={this.state.username} onChange={this.usernameChange}></input>
        <input style={loginChildStyle} placeholder="Password..." type="password" value={this.state.password} onChange={this.passwordChange}></input>
        <button style={loginChildStyle} onClick={this.loginButton}>Login</button>
        <button style={loginChildStyle} onClick={this.createAccountButton}>Create Account</button>
    </div>
    )};
}


const loginDivStyle = {
    "display": "flex",
    "flexDirection": "column",
    "width": "100%",
    "height": "100%",
    "textAlign": "center",
    "marginLeft": "auto",
    "marginRight": "auto",
    "fontFamily": "'Lato', sans-serif"
};
const loginChildStyle = {
    "border": "0",
    "margin": "10px",
    "width": "40%",
    "marginLeft": "auto",
    "marginRight": "auto",
    padding: "10px",
    "borderRadius": "5px",
    "boxShadow": "2px 2px 8px #ddd"
}



const domContainer = document.querySelector('#react-div');
ReactDOM.render(<LoginPage />,domContainer);