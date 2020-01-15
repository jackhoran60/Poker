const socket = io.connect()

var username;
var chips;
var playing = true;
var my_card_1
var my_card_2
socket.on('your_username', (name) => {
    username = name
})
socket.on("test", () => {
    console.log("wowza")
})
socket.on("begin_round", () => {
    console.log("new round beginning")
})

socket.emit("connected", {blah: "blah"})
socket.on("your_cards", (data) => {
    console.log("we here")
    console.log(data)
})

class Betting_Window extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            value: ''
        }
        this.fold = this.fold.bind(this)
        this.handleInput = this.handleInput.bind(this)
        this.bet = this.bet.bind(this)
        this.componentDidDismount = this.componentDidDismount.bind(this)
    }
    //lots of TODO with adding check & call buttons and validating user input
    fold(){
        socket.emit("betting_res", {action: "fold"})
    }

    handleInput(event){
        this.setState({
            value: event.target.value
        })
    }
    componentDidDismount(){
        this.setState({
            value: ''
        })
    }
    bet(){
        socket.emit("betting_res", {action: "bet", amount: parseInt(this.state.value)})
    }
    render(){
        if(this.props.active){
            return (
                <div style={betting_window_style}>
                    <button onClick={this.fold}>Fold</button>
                    <input type="text" value={this.state.value} onChange={this.handleInput}/>
                    <button onClick={this.bet}>Place Bet</button>
                </div>
                
            )
        }
        else {
            return (
                null
            )
        }
    }
}
const betting_window_style = {
    textAlign: 'center'

}
function Chips(props){
    return props.chips
}
function Turn(props){
    return <p style={betting_window_style}>Whose Turn: {props.turn}</p>
}
function Pot(props){
    return <p style={betting_window_style}>Pot: {props.pot}</p>
}

class Table extends React.Component {
    constructor(props){
        super(props)
        console.log(this.props.cards.card_1)
    }
    render(){
        console.log(this.props.cards)
        return(
            <div style={table_style}>
                <Card showing={this.props.cards["card_1"].showing} card={this.props.cards["card_1"].card} size={1.5}/>
                <Card showing={this.props.cards["card_2"].showing} card={this.props.cards["card_2"].card} size={1.5}/>
                <Card showing={this.props.cards["card_3"].showing} card={this.props.cards["card_3"].card} size={1.5}/>
                <Card showing={this.props.cards["card_4"].showing} card={this.props.cards["card_4"].card} size={1.5}/>
                <Card showing={this.props.cards["card_5"].showing} card={this.props.cards["card_5"].card} size={1.5}/>
            </div>
        )
    }
}
const table_style = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: '20px'
}
class Player_Window extends React.Component {
    constructor(props){
        super(props)

        
    }
    render() { 
        var players = Object.keys(this.props.player_data)
        if(!players.length){
            return <div></div>;
        }
        else {
        return (
        <div style={player_window_style}>
            {players.map(name => {
                
                if(name === username){
                    return null;
                }
                return <Player_Card chips={this.props.player_data[name]["chips"]} showing={false} size={1} key={name} name={name} playing={this.props.player_data[name]["playing"]} card_1={null} card_2={null}/>
            })}
        </div>
        
    )}}
}
const player_window_style = {
    'display': 'flex',
    'flexDirection': 'row',
    'justifyContent': 'space-evenly',
    'margin': '20px'
}

class Player_Card extends React.Component {
    constructor(props){
        super(props)
        
    }
    render(){
        if(!this.props.playing){
            return (
                <div style={player_card_style}>
                    <p style={pp_style}>{this.props.name}</p>
                    <p><i>Folded</i></p>
                    <p style={pp_style}>{this.props.chips} chips</p>
                </div>
            )
        }
        else {
            return (
                <div style={player_card_style} textalign='center'>
                    <p style={pp_style} textalign='center'>{this.props.name}</p>
                    <div>
                        <Card showing={this.props.showing} size={this.props.size} card={this.props.card_1}/>
                        <Card showing={this.props.showing} size={this.props.size} card={this.props.card_2}/>
                        <p style={pp_style}><Chips chips={this.props.chips}/> chips</p>
                    </div>
                </div>
            )
        }
    }
}
const pp_style = {
    margin: '4px'
}
const player_card_style = {
    'textAlign': 'center',
    'margin': '15px',
    'backgroundColor': '#E5D1C5',
    'display': 'inline-flex',
    'flexDirection': 'column',
    'alignItems': 'center',
    'width': 'auto',
    'padding': '10px',
    'borderRadius': '3px',
    'boxShadow': '2px 2px 8px #dadada'
}
class Card extends React.Component {
    //CARD SOURCE: http://acbl.mybigcommerce.com/52-playing-cards/
    constructor(props){
        super(props)
        this.determine_card_string = this.determine_card_string.bind(this)
    }
    determine_card_string(card){
        var c_string = ''
        switch(card.value) {
            case 14:
                c_string += 'A'
                break
            case 13:
                    c_string += 'K'
                    break
            case 12:
                    c_string += 'Q'
                    break
            case 11:
                    c_string += 'J'
                    break
            default:
                c_string += '' + card.value
        }
        c_string += card.suit.substring(0,1).toUpperCase() + ".png";
        return c_string;
    }

    render(){
        var width = 66 * this.props.size;
        var length = 100 * this.props.size;
        if(this.props.showing){
            var card = this.determine_card_string(this.props.card);
            return <img width={width} length={length} style={card_style} src={'../cards/'+card}></img>
        }
        else{
            return <img width={width} length={length} style={card_style} src='../cards/back.png'></img>
        }
    }
}
const card_style = {
    'margin': '5px'
}
class Players extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            players: []
        }
        

        
        this.updatePlayers = this.updatePlayers.bind(this);
        this.updatePlayers()
    }
    updatePlayers(){
        
        socket.on("players_list", (data) => {
            // console.log(data.queued)
            this.setState({
                players: data[this.props.cat]
            })
        })
    }

    render() {
        if(!this.state.players.length){
            return <div></div>
        }
        else {
            return (
                <div>
                    {this.state.players.map(name => {
                        return <Player key={name} name={name}/>
                    })}
                </div>
        )}
    };
    
}



function Player(props){
    return <p style={playerStyle} >{props.name}</p>;
}
const playerStyle = {
    "margin": "2px",
    "textAlign": "left",
    "color": "black"
}

ReactDOM.render(<Players cat={"queued"}/>,document.getElementById("react_queued_players"));
// ReactDOM.render(<Players cat={"active"}/>,document.getElementById("react_active_players"));

socket.on("client_player_data", (data) => {
    ReactDOM.render(<Player_Window style={player_window_style} player_data={data}/>,document.getElementById("react_player_window"));
    chips = data[username]["chips"]
})
socket.on("table_data", (data) => {
    ReactDOM.render(<Table cards={data}/>, document.getElementById("react_table"))
})
socket.on("whose_turn", (data) => {
    ReactDOM.render(<Turn turn={data}/>, document.getElementById('react_turn'))
})
socket.on("pot_size", (data) => {
    ReactDOM.render(<Pot pot={data}/>, document.getElementById('react_pot'))
})
socket.on("your_cards", (data) => {

    var cards = <Player_Card chips={data.chips} card_1={data.card_1} card_2={data.card_2} playing={playing} showing={true} name={username} size={2} />
    ReactDOM.render(cards, document.getElementById("react_my_hand"))
})

socket.on("betting_req", (data) => {
    ReactDOM.render(<Betting_Window active={data}/>,document.getElementById("react_betting_window"))
})

socket.on("poker_log", (data) => {
    document.getElementById("react_log").appendChild(document.createTextNode(data))
    document.getElementById("react_log").appendChild(document.createElement("br"))
})