# Worklist


#### Min. Requirements:  (13.09)

* ##### Schriftzüge / Pop-Ups
    * Font auswählen
    * Größe festlegen (responsive)
    * Killingsprees
    * Terminations (Ende einer Killingspree)
    * Bot Announcement: 3, 2, 1 (fast) PARTY-CRASHER!!!

* ##### Extensive Testing
    * Performance-Test:  6 Spieler + 2 Bots
    * Test on Brändles Machine & Beamer (06.09)
    * Game-Break Session (06.09)
    * Test other Browsers (and update restrictions) :
        * Firefox
        * Edge
    * Test Router/Wifi-Hotspot

#### Bug Fixes: (13.09)
* ##### Maximize Button
    * when maximized, Button sollte minimizen
* ##### Spawn in useless locations (Tanks, Bots & Powerups)
    * Check Spawn-Function and prevent spawn in gaps
* ##### Iphone Zoom Bug
    * prevent Zooming-Function
* ##### Disable Bot Self-Killing
    * Tanks shouldn't hit themselves anymore
* #### Bullets ignore corner Collision
    * Bullets should never ignore Walls    

#### Potential Extensions: 
* ##### In-Game Start Pause
    * Powerupspawn-Disable
    * Tankspawn-Disable
    *  Countdown: 3,2,1 (slowly) - PARTY! 
    *  Countdown auch auf Control-View ? (Overlay)
* ##### New Bullet collision function
    * pre-check Wall collision
    * reduce performance Costs
* ##### Different type fo Bots
    * Kamikaze Bots
        * explode on Collision with tank and kill tank (200dmg)
    * Turrets
        * Wall-Blocks that have a gun and shoot at a tanks position every x seconds 
        * maybe calculate the closest tank
        * doesnt matter if it hits the wall often

* ##### Bot Spawn Timer Box
    * display overall countdown (3min) until the bots spawn in a Box
* ##### Bot "map cleaning" process
    * disable Respawn-Function of Tanks
    * check for bug when bots are ingame, but no players are
        ```sh
        if (bots.length > 0){
            //disable respawn Button
            //change Control View to display: "Keine Party mit Partycrashern ..."
            if (tanks [] <= 0) {
                //despawn bots /or make them leave ?
                //enable respawn Button
            }
        }
        ```



        
        

