import { Component } from 'react'
import Router from 'next/router'
import Link from 'next/link'
import Header from '../components/Header'


class Poker extends Component {
    constructor(props){
        super(props);
    }
    //one big todo
    //im going to invest my time in making poker itself
    render() {return (
        
        <div style={PokerStyle}>
            <Header/>
            <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet"></link>
            
        </div>
        
        
    )};
}

let PokerStyle = {
    "fontFamily": "'Lato', sans-serif",
    "textAlign": "center"
}



export default Poker