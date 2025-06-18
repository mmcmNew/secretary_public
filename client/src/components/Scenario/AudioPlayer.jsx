import { PropTypes } from 'prop-types'
import { useEffect } from 'react'


export default function AudioPlayer({ element, elementId, isStartPlay = null, onExpireFunc = null,
    currentActionId=null }){

    useEffect(() => {
        if (isStartPlay) {
            document.getElementById(elementId).play();
        }
    }, [isStartPlay])

    useEffect(() => {
        if (currentActionId === elementId) {
            document.getElementById(elementId).play();
        }
    }, [currentActionId])

    if (!element) {
        return null;
    }

    return(
        <audio id={elementId} controls src={`audio/${element.url}`}
            onEnded={()=>{onExpireFunc(elementId)}} />
    )
}

AudioPlayer.propTypes = {
    element: PropTypes.object,
    elementId: PropTypes.string,
    isStartPlay: PropTypes.bool,
    onExpireFunc: PropTypes.func,
    currentActionId: PropTypes.string,
}
