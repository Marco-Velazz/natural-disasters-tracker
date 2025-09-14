import React from 'react'

const Header = () => {
  return (
    <header className='header'> 
      <h1>
        <img 
          src="https://img.icons8.com/color/48/000000/fire-element.png" 
          alt="fire icon" 
          style={{ width: "32px", height: "32px", marginRight: "8px" }}
        />
        Wildfire Tracker (Powered By NASA)
      </h1>
    </header>
  )
}


export default Header
